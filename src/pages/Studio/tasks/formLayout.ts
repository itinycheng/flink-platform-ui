// Shared responsive Col spans for the task-definition form fields (JobForm +
// configFields), using Ant Design's own grid breakpoints — no custom CSS.
// 1 column on mobile, 2 on md, 3 on xxl.
export const FIELD_COL = { xs: 24, md: 12, xxl: 8 } as const;
/** A field that spans the whole row (textarea, code editor, multi-select, etc.). */
export const FULL_COL = { span: 24 } as const;
