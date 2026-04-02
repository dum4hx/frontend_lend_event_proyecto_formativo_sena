# Form Help Anchor Convention

Use this convention for every new form to enable contextual help without changing panel logic.

## Base rules

- Use lowercase kebab-case.
- Prefix every anchor with the module id.
- Keep names semantic and stable.
- Prefer wrapping non-native controls (custom selects, grouped widgets) in a container with anchor.

## Required anchors

- Form root:
  - `data-help-id="<module>-form-create"`
  - `data-help-id="<module>-form-edit"`
- Primary actions:
  - `data-help-id="<module>-form-submit"`
  - `data-help-id="<module>-form-cancel"`

## Field anchors

- Pattern:
  - `data-help-id="<module>-form-<field-name>"`
- Examples:
  - `data-help-id="customers-form-email"`
  - `data-help-id="roles-form-permissions"`
  - `data-help-id="locations-form-department"`

## Dynamic list items

- Pattern with index or entity id:
  - `data-help-id="<module>-form-<list-name>-<index-or-id>"`
- Example:
  - `data-help-id="transfer-requests-form-item-model-0"`

## Form guide selector mapping

- `formGuide.selector` must target the form root anchor.
- `fields[].selector` must target exact field anchor.
- `actions[].selector` should target explicit action anchors when available.

## Quick checklist

- Added form root anchor for each mode shown in UI.
- Added anchors for all required fields.
- Added anchors for submit and cancel actions.
- Added or updated module `formGuides` in help content.
- Verified selectors match rendered DOM.
