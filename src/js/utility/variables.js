/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const { ipcRenderer } = require('electron')

const detect = require('charset-detector')
const srt = require('subtitle')
const ssa = require('ass-compiler')

const path = require('path')
const fs = require('fs-extra')
const nspell = require('nspell')

let i18n = {}
let rows = []
let styles = []
let result = {}
let assessment = {}
let spellChecker = null
let step = 0
let dictionary
let SubStationAlpha

if (!JSON.parse(localStorage.getItem('dictionaries'))) {
  localStorage.setItem('dictionaries', '[]')
}

if (!localStorage.getItem('lang')) {
  localStorage.setItem('lang', 'en')
}
