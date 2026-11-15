import type { BeforeMount } from '@monaco-editor/react'

export const defineDevCraftMonacoThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('devcraft-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '647084', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7045DB' },
      { token: 'string', foreground: '16A36A' },
      { token: 'number', foreground: 'F2A900' },
      { token: 'type', foreground: '9065FF' },
      { token: 'type.identifier', foreground: '9065FF' },
      { token: 'function', foreground: '3985FF' },
      { token: 'tag', foreground: 'E5484D' },
      { token: 'attribute.name', foreground: '9065FF' },
      { token: 'attribute.value', foreground: '16A36A' },
      { token: 'operator', foreground: '27C9E8' },
      { token: 'delimiter', foreground: '647084' },
    ],
    colors: {
      'editor.background': '#F7F5F2',
      'editor.foreground': '#111827',
      'editorLineNumber.foreground': '#647084',
      'editorLineNumber.activeForeground': '#111827',
      'editorCursor.foreground': '#080D1C',
      'editor.selectionBackground': '#FF790033',
      'editor.lineHighlightBackground': '#ECEEF2',
      'editorIndentGuide.background1': '#D7DAE1',
      'editorIndentGuide.activeBackground1': '#647084',
    },
  })

  monaco.editor.defineTheme('devcraft-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'C8CBD4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'B9A1FF' },
      { token: 'string', foreground: '40D6A1' },
      { token: 'number', foreground: 'FFC247' },
      { token: 'type', foreground: 'B9A1FF' },
      { token: 'type.identifier', foreground: 'B9A1FF' },
      { token: 'function', foreground: '72AAFF' },
      { token: 'tag', foreground: 'FF8A80' },
      { token: 'attribute.name', foreground: 'B9A1FF' },
      { token: 'attribute.value', foreground: '40D6A1' },
      { token: 'operator', foreground: '27C9E8' },
      { token: 'delimiter', foreground: 'C8CBD4' },
    ],
    colors: {
      'editor.background': '#10182B',
      'editor.foreground': '#F7F5F2',
      'editorLineNumber.foreground': '#C8CBD4',
      'editorLineNumber.activeForeground': '#F7F5F2',
      'editorCursor.foreground': '#FFAA00',
      'editor.selectionBackground': '#FF790044',
      'editor.lineHighlightBackground': '#151E32',
      'editorIndentGuide.background1': '#344054',
      'editorIndentGuide.activeBackground1': '#C8CBD4',
    },
  })
}
