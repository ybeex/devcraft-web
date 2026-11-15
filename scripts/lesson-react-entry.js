import React from 'react'
import * as ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

window.React = React
window.ReactDOM = Object.assign({}, ReactDOM, { createRoot })
