export function validateValue(rule, value) {
  const errors = [];

  // type and empties
  if (rule.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value))
      errors.push('Value must be a number.');
    if (rule.validate?.min != null && value < rule.validate.min)
      errors.push(`Minimum is ${rule.validate.min}.`);
    if (rule.validate?.max != null && value > rule.validate.max)
      errors.push(`Maximum is ${rule.validate.max}.`);
    if (rule.validate?.step != null && Number.isFinite(value)) {
      const step = rule.validate.step;
      const base = rule.validate.min ?? 0;
      const off = Math.abs((value - base) / step - Math.round((value - base) / step));
      if (off > 1e-9) errors.push(`Must be in increments of ${step}.`);
    }
  } else if (rule.type === 'enum') {
    const options = rule.options || [];
    if (!options.includes(String(value))) errors.push('Select a valid option.');
  } else if (rule.type === 'string') {
    const s = String(value ?? '');
    if (rule.validate?.maxLength && s.length > rule.validate.maxLength) {
      errors.push(`Maximum length is ${rule.validate.maxLength} characters.`);
    }
  } else if (rule.type === 'boolean') {
    // no-op
  }

  return errors;
}

export function attachFieldError(el, messages) {
  let err = el.nextElementSibling;
  if (!err || !err.classList?.contains('settings-error')) {
    err = document.createElement('div');
    err.className = 'settings-error';
    el.insertAdjacentElement('afterend', err);
  }
  if (messages.length) {
    err.textContent = messages[0];
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute(
      'aria-describedby',
      err.id || (err.id = `err-${el.id || Math.random().toString(36).slice(2)}`),
    );
  } else {
    err.textContent = '';
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }
}

export function validateDraftAgainstSchema(schema, draft, idToKeyMap) {
  const errors = {};
  for (const s of schema.settings) {
    const value = draft[s.storageKey];
    const msgs = validateValue(s, value);
    if (msgs.length) errors[s.storageKey] = msgs;
  }

  // reflect into DOM for mapped controls
  for (const [sel, key] of Object.entries(idToKeyMap)) {
    const el = document.querySelector(sel);
    if (!el) continue;
    attachFieldError(el, errors[key] || []);
  }
  return errors;
}
