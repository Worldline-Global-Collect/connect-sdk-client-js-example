import type { WlFieldElement } from '@/mixins';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

type Option = { value: string; label: string };

type RadioOption = {
  label: string;
  value: string;
  checked?: boolean;
  fields?: Field[];
};

export type FieldBasic = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  autofocus?: boolean;
};

export type Input = FieldBasic & {
  component: 'input';
  prefixIcon?: string;
  type?: string;
  pattern?: string;
  value?: string;
  step?: number;
  autocomplete?: string;
};

export type Select = FieldBasic & {
  component: 'select';
  options: Option[];
  selected?: Option['value'];
  autocomplete?: string;
};

export type Checkbox = FieldBasic & {
  component: 'checkbox';
  alert?: string;
  fields: Field[];
};

export type Radio = FieldBasic & {
  component: 'radio';
  checked?: boolean;
  value: string;
  fields?: Field[];
};

export type RadioGroup = FieldBasic & {
  component: 'radio-group';
  options: RadioOption[];
};

export type Field = Select | Input | Checkbox | Radio | RadioGroup;
export type PaymentProductFieldElement = InstanceType<typeof WlFieldElement>;
