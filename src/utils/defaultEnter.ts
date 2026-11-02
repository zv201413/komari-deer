const actionSelector = 'button[data-enter-submit], button[type="submit"], input[type="submit"]';
const dialogSelector = '[role="dialog"], [role="alertdialog"]';

function isVisible(element: HTMLElement): boolean {
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  const style = element.ownerDocument.defaultView!.getComputedStyle(element);
  return element.getClientRects().length > 0 && style.visibility !== "hidden";
}

function actionsIn(scope: HTMLElement): HTMLButtonElement[] {
  return Array.from(scope.querySelectorAll<HTMLButtonElement>(actionSelector))
    .filter((button) => isVisible(button) && button.closest(dialogSelector) === scope.closest(dialogSelector));
}

function chooseAction(actions: HTMLButtonElement[]): HTMLButtonElement | null {
  if (actions.length === 1) return actions[0];
  const primary = actions.filter((button) => button.hasAttribute("data-enter-primary"));
  if (primary.length === 1) return primary[0];
  // Two copies of the same Save action (for example above and below a long
  // settings page) may share a nonempty key. Different actions stay ambiguous.
  const key = actions[0]?.dataset.enterSubmit;
  return key && actions.every((button) => button.dataset.enterSubmit === key) ? actions[0] : null;
}

function ignoresEnter(target: HTMLElement): boolean {
  return Boolean(target.closest(
    'textarea, select, [contenteditable]:not([contenteditable="false"]), ' +
    '[data-enter-ignore], .xterm, [role="combobox"], [role="listbox"], ' +
    '[role="menu"], [role="menuitem"], [role="option"], [role="tablist"], [role="slider"]'
  ));
}

/** Bind Enter to an explicitly declared action in the current editing area.
 * Native forms and focused buttons retain their normal keyboard behavior.
 */
export function installDefaultEnterAction(doc: Document): () => void {
  const initializedDialogs = new WeakSet<HTMLElement>();
  const focusDialogAction = (target: Element | null) => {
    const dialog = target?.closest<HTMLElement>(dialogSelector);
    if (!dialog || initializedDialogs.has(dialog)) return;
    initializedDialogs.add(dialog);
    // Confirmation dialogs without editable fields start on Confirm.
    const fields = Array.from(dialog.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]'
    )).filter((field) => isVisible(field) && !field.matches(":disabled"));
    if (fields.length === 0) {
      const action = chooseAction(actionsIn(dialog));
      if (action && !action.disabled) action.focus({ preventScroll: true });
    }
  };
  const focusin = (event: FocusEvent) => {
    if (event.target instanceof doc.defaultView!.Element) focusDialogAction(event.target);
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.defaultPrevented || event.isComposing ||
      event.keyCode === 229 || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (!(target instanceof doc.defaultView!.HTMLElement) || ignoresEnter(target)) return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    // Let focused buttons, links and native pickers perform their own action.
    if (target.closest('button, a[href], input[type="button"], input[type="submit"], input[type="file"], input[type="color"]')) return;

    const dialogs = Array.from(doc.querySelectorAll<HTMLElement>(dialogSelector)).filter(isVisible);
    const dialog = dialogs.at(-1);
    if (dialog && !dialog.contains(target)) return;
    const boundary = dialog ?? doc.body;
    // A real form already supports implicit Enter submission and validation.
    const form = target.closest("form");
    if (form && actionsIn(form).some((button) => button.form === form && button.type === "submit")) return;

    for (let scope: HTMLElement | null = target; scope; scope = scope.parentElement) {
      const actions = actionsIn(scope);
      if (actions.length > 0 || scope.hasAttribute("data-enter-scope") || scope === boundary) {
        const action = chooseAction(actions);
        if (action && !action.disabled && action.getAttribute("aria-disabled") !== "true" &&
          action.getAttribute("aria-busy") !== "true") {
          event.preventDefault();
          action.click();
        }
        return;
      }
      if (scope === doc.body) return;
    }
  };
  doc.addEventListener("keydown", keydown);
  doc.addEventListener("focusin", focusin);
  focusDialogAction(doc.activeElement);
  return () => {
    doc.removeEventListener("keydown", keydown);
    doc.removeEventListener("focusin", focusin);
  };
}
