/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function getDur (row) {
  return {
    start: 'Start' in row ? row.Start : row.start,
    end: 'End' in row ? row.End : row.end
  }
}

function getDuration (row) {
  return 'Start' in row ? row.End - row.Start : (row.end - row.start) / 1000
}

function getLines (row, ssa = false) {
  return ssa ? row.split(/\\(?:n|N)/) : row.split(/\r\n|\n/)
}

function getRaw (row) {
  return row
    .replace(/(?:\\(?:n|N)|\r\n|\n)/g, '')
    .replace(/(?:<[^>]*>|{[^}]*})/g, '')
    .replace(/[+.,/#!?$%^&*;"':=\-—_`~()[\] ]/g, '')
}

function getAlphabet (str) {
  return str
    .replace(/(?:\\(?:n|N)|\r\n|\n)/g, '')
    .replace(/(?:<[^>]*>|{[^}]*})/g, '')
    .replace(/[+.,/#!?$%^&*;"':=\-—_`~()[\]\d]/g, '')
}

function getWords (row) {
  let words = getAlphabet(row).split(' ')
  let i = words.length

  while (i) {
    words[i - 1] = words[i - 1].trim()

    if (!words[i - 1].length) {
      words.splice(i - 1, 1)
    }

    i--
  }

  return words
}

function checkCPS (row, duration) {
  return new Promise((resolve, reject) => {
    resolve(duration > 0 ? Math.round(getRaw(row).length / duration) : 0)
  })
}

function checkCPL (row, lines) {
  return new Promise((resolve, reject) => {
    let maxLength = 0

    for (let line of lines) {
      let length = getRaw(line).length
      if (length > maxLength) {
        maxLength = length
      }
    }

    resolve(maxLength)
  })
}

function checkOLI (dur, index, rows) {
  return new Promise((resolve, reject) => {
    let found = []
    let rw

    for (let i = 0; i < rows.length; i++) {
      if (index !== i) {
        rw = getDur(rows[i])
        if ((dur.start <= rw.start && rw.start <= dur.end) || (dur.start <= rw.end && rw.end <= dur.end)) {
          found.push(i + 1)
        }
      }
    }

    resolve(found)
  })
}

function checkSNT (row) {
  return new Promise((resolve, reject) => {
    const regex = /(?: +\\N +| +\\N|\\N +)/g
    let found = []

    if (row.match(regex)) {
      let match
      while ((match = regex.exec(row)) !== null) {
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
        found.push(match.index + 1)
      }
    }

    resolve(found)
  })
}

function checkITA (row, ssa = false) {
  return new Promise((resolve, reject) => {
    let shouldbe = $('<textarea>')
      .html(
        $('<div>')
          .html(row)
          .html()
      )
      .text()

    if (!ssa && row !== shouldbe) {
      shouldbe = getLines(shouldbe).join('\\N')
      resolve(shouldbe)
    }

    let tags = []
    let valid
    let name

    if (ssa) {
      valid = ['b', 'i', 'u', 's', 'bord', 'xbord', 'ybord', 'shad', 'xshad', 'yshad', 'be', 'blur', 'fn', 'fs', 'fscx', 'fscy', 'fsp', 'frx', 'fry', 'frz', 'fr', 'fax', 'fay', 'fe', 'c', 'c1', 'c2', 'c3', 'c4', 'alpha', 'a1', 'a2', 'a3', 'a4', 'an', 'a', 'k', 'K', 'kf', 'ko', 'q', 'r', 'pos', 'move', 'org', 'fad', 'fade', 't', 'clip', 'iclip', 'p', 'pbo']

      for (let parsed of row) {
        for (let tag of parsed.tags) {
          name = Object.keys(tag).join('')
          if (name.length && !valid.includes(name)) {
            tags.push(name)
          }
        }
      }
    } else {
      let elements = $('<div>')
        .html(row)
        .children()
      valid = ['b', 'i', 'u']

      elements.each(function () {
        name = $(this)
          .prop('tagName')
          .toLowerCase()

        if (name === 'font') {
          if (!$(this).prop('attributes').length || ($(this).prop('attributes').length === 1 && $(this).prop('attributes')[0].name !== 'color') || $(this).prop('attributes').length > 1) {
            tags.push(name)
          }
        } else if (!valid.includes(name)) {
          tags.push(name)
        }
      })
    }

    resolve(tags)
  })
}

function checkUNE (line) {
  return new Promise((resolve, reject) => {
    const regex = /\\(?:n|N)/g
    let found = []

    if (line.match(regex)) {
      let match
      while ((match = regex.exec(line)) !== null) {
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
        found.push(match.index + 1)
      }
    }

    resolve(found)
  })
}

function checkUSP (line) {
  return new Promise((resolve, reject) => {
    const regex = / {2,}/g
    let found = []

    line = line.replace(/(?:<[^>]*>|{[^}]*})/g, match => {
      return '.'.repeat(match.length)
    })

    if (line.match(regex)) {
      let match
      while ((match = regex.exec(line)) !== null) {
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
        found.push(match.index + 1)
      }
    }

    resolve(found)
  })
}

function getCanBeCheckWords (line) {
  let lang = localStorage.getItem('lang')
  let words = getWords(line)
  let found = []

  for (let word of words) {
    if (word.length > 4 && line.indexOf(word) !== -1 && word.search(/[âêîôû]/i) === -1) {
      found.push(word.toLocaleLowerCase(lang))
    }
  }

  return found
}

function checkSER (line) {
  return new Promise((resolve, reject) => {
    let lang = localStorage.getItem('lang')
    let words = getCanBeCheckWords(line)
    let found = {}
    let suggest

    for (let word of words) {
      if (!spellChecker.correct(word)) {
        suggest = spellChecker.suggest(word)

        for (let i = 0; i < suggest.length; i++) {
          suggest[i] = suggest[i].toLocaleLowerCase(lang)
        }

        if (suggest.length && !suggest.includes(word)) {
          suggest.splice(10)
          found[word] = suggest
        }
      }
    }

    resolve(found)
  })
}

function progress (rows) {
  return new Promise(async (resolve, reject) => {
    result = {
      rows: [],
      problems: {
        charactersPerSecond: [],
        charactersPerLine: [],
        spacedNTags: [],
        unnecessarySpaces: [],
        negativeDurations: [],
        overlappingLines: [],
        spellingErrors: [],
        unsupportedNewLines: [],
        invalidTags: []
      },
      alphaGrade: ''
    }

    let text
    let dur
    let duration
    let lines

    let i = 0
    let j
    while (i < rows.length) {
      await new Promise((resolve, reject) => {
        $('.progress-bar').progress('increment')
        resolve(50)
      })
        .then(data => {
          return sleep(data)
        })
        .then(
          data =>
            new Promise((resolve, reject) => {
              text = SubStationAlpha ? rows[i].Text.raw : rows[i].text
              dur = getDur(rows[i])
              duration = getDuration(rows[i])
              lines = getLines(text, SubStationAlpha)
              j = 0

              result.rows.push({
                row: rows[i].row,
                start: SubStationAlpha ? dur.start * 1000 : dur.start,
                end: SubStationAlpha ? dur.end * 1000 : dur.end,
                duration: duration,
                grade: 0,
                lines: [],
                text: lines.join('\\N')
              })

              resolve(true)
            })
        )
        .then(data => {
          return checkCPS(text, duration)
        })
        .then(
          data =>
            new Promise((resolve, reject) => {
              if (data > 20) {
                result.problems.charactersPerSecond.push({
                  index: i,
                  words: getWords(text).length,
                  chars: getRaw(text).length,
                  value: data
                })

                result.rows[i].grade += 22
              }

              resolve(true)
            })
        )
        .then(data => {
          return checkCPL(text, lines)
        })
        .then(
          data =>
            new Promise((resolve, reject) => {
              if (data > 40) {
                result.problems.charactersPerLine.push({
                  index: i,
                  value: data
                })

                result.rows[i].grade += 18
              }

              resolve(true)
            })
        )
        .then(data => {
          return SubStationAlpha ? checkSNT(result.rows[i].text) : pass()
        })
        .then(data =>
          SubStationAlpha
            ? new Promise((resolve, reject) => {
              if (data.length) {
                result.problems.spacedNTags.push({
                  index: i,
                  value: data
                })

                result.rows[i].grade += 15
              }

              resolve(true)
            })
            : pass()
        )
        .then(data => checkITA(SubStationAlpha ? rows[i].Text.parsed : text, SubStationAlpha))
        .then(
          data =>
            new Promise((resolve, reject) => {
              if (data.length) {
                result.problems.invalidTags.push({
                  index: i,
                  value: data
                })

                result.rows[i].grade += 12
              }

              resolve(true)
            })
        )
        .then(
          data =>
            new Promise((resolve, reject) => {
              if (duration <= 0) {
                result.problems.negativeDurations.push({
                  index: i,
                  value: duration
                })

                result.rows[i].grade += 10
              }

              resolve(true)
            })
        )
        .then(data => (!SubStationAlpha ? checkOLI(dur, i, rows) : pass()))
        .then(data =>
          !SubStationAlpha
            ? new Promise((resolve, reject) => {
              if (data.length) {
                result.problems.overlappingLines.push({
                  index: i,
                  value: data
                })

                result.rows[i].grade += 5
              }

              resolve(true)
            })
            : pass()
        )
        .then(
          data =>
            new Promise(async (resolve, reject) => {
              while (j < lines.length) {
                await new Promise((resolve, reject) => {
                  result.rows[i].lines.push(lines[j])
                  resolve(true)
                })
                  .then(data => checkSER(lines[j]))
                  .then(
                    data =>
                      new Promise((resolve, reject) => {
                        if (Object.keys(data).length) {
                          if (!result.problems.spellingErrors.length || (result.problems.spellingErrors.length && result.problems.spellingErrors[result.problems.spellingErrors.length - 1].index !== i)) {
                            result.rows[i].grade += 20
                          }

                          result.problems.spellingErrors.push({
                            index: i,
                            line: j,
                            value: data
                          })
                        }

                        resolve(true)
                      })
                  )
                  .then(data => (!SubStationAlpha ? checkUNE(lines[j]) : pass()))
                  .then(data =>
                    !SubStationAlpha
                      ? new Promise((resolve, reject) => {
                        if (data.length) {
                          if (!result.problems.unsupportedNewLines.length || (result.problems.unsupportedNewLines.length && result.problems.unsupportedNewLines[result.problems.unsupportedNewLines.length - 1].index !== i)) {
                            result.rows[i].grade += 10
                          }

                          result.problems.unsupportedNewLines.push({
                            index: i,
                            line: j,
                            value: data
                          })
                        }

                        resolve(true)
                      })
                      : pass()
                  )
                  .then(data => (SubStationAlpha ? (!j ? checkUSP(lines[j].trimEnd()) : j === lines.length - 1 ? checkUSP(lines[j].trimStart()) : checkUSP(lines[j].trim())) : checkUSP(lines[j])))
                  .then(
                    data =>
                      new Promise((resolve, reject) => {
                        if (data.length) {
                          if (!result.problems.unnecessarySpaces.length || (result.problems.unnecessarySpaces.length && result.problems.unnecessarySpaces[result.problems.unnecessarySpaces.length - 1].index !== i)) {
                            result.rows[i].grade += 3
                          }

                          result.problems.unnecessarySpaces.push({
                            index: i,
                            line: j,
                            value: data
                          })
                        }

                        resolve(true)
                      })
                  )
                  .then(
                    data =>
                      new Promise((resolve, reject) => {
                        j++
                        resolve(true)
                      })
                  )
              }

              resolve(true)
            })
        )
        .then(
          data =>
            new Promise((resolve, reject) => {
              i++
              resolve(true)
            })
        )
    }

    resolve(true)
  })
}

function report (result) {
  return new Promise((resolve, reject) => {
    let index
    let line
    let element
    let color

    result.alphaGrade = getAlphaGrade(calculateNumGrade(result.rows))
    assessment.grade = result.alphaGrade

    switch (result.alphaGrade) {
      case 'F':
        color = 'red'
        break
      case 'D-':
        color = 'pink'
        break
      case 'D':
        color = 'purple'
        break
      case 'D+':
        color = 'violet'
        break
      case 'C-':
        color = 'yellow'
        break
      case 'C':
        color = 'spicednectarine'
        break
      case 'C+':
        color = 'orange'
        break
      case 'B-':
        color = 'olive'
        break
      case 'B':
        color = 'wintergreen'
        break
      case 'B+':
        color = 'green'
        break
      case 'A-':
        color = 'teal'
        break
      case 'A':
        color = 'neonblue'
        break
      case 'A+':
        color = 'blue'
    }

    $('.report-tabs .grade-box h1:last-child')
      .text(result.alphaGrade)
      .removeClass('red spicednectarine orange yellow pink purple violet olive wintergreen green teal neonblue blue')
      .addClass(color)

    $('.report-tabs > .tab .item.hidden, .report-tabs > .tab > .tab.hidden').removeClass('hidden')
    $('.report-tabs > .tab > .tab .dimmed').dimmer('hide')
    $('.report-tabs > .tab > .tab table tbody tr').remove()

    if (SubStationAlpha) {
      $('*[data-tab="syntax/une"], *[data-tab="technical/oli"]').addClass('hidden')
    } else {
      $('*[data-tab="semantic/snt"]').addClass('hidden')
    }

    $('.report-tabs .item').tab('change tab', 'overall')

    if (result.problems.charactersPerSecond.length) {
      for (let problem of result.problems.charactersPerSecond) {
        index = problem.index
        addItem('cps-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), result.rows[index].duration.toFixed(2) + 's', decodeHTML(result.rows[index].text), problem.words, problem.chars, problem.value])
      }
    } else {
      $('.cps-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.charactersPerLine.length) {
      for (let problem of result.problems.charactersPerLine) {
        index = problem.index
        addItem('cpl-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].text), result.rows[index].lines.length, problem.value])
      }
    } else {
      $('.cpl-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.negativeDurations.length) {
      for (let problem of result.problems.negativeDurations) {
        index = problem.index
        addItem('ndu-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), result.rows[index].duration.toFixed(2) + 's', decodeHTML(result.rows[index].text)])
      }
    } else {
      $('.ndu-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.overlappingLines.length) {
      for (let problem of result.problems.overlappingLines) {
        index = problem.index
        addItem('oli-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].text), problem.value.join(', ')])
      }
    } else {
      $('.oli-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.invalidTags.length) {
      for (let problem of result.problems.invalidTags) {
        index = problem.index
        addItem('ita-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].text), Array.isArray(problem.value) ? problem.value.join(', ') : decodeHTML(problem.value)])
      }
    } else {
      $('.ita-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.unsupportedNewLines.length) {
      for (let problem of result.problems.unsupportedNewLines) {
        index = problem.index
        line = problem.line
        addItem('une-table', [result.rows[index].row + 1, line + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].lines[line]), problem.value.join(', ')])
      }
    } else {
      $('.une-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.spellingErrors.length) {
      for (let problem of result.problems.spellingErrors) {
        index = problem.index
        line = problem.line
        element = ''

        for (let mistake in problem.value) {
          element += '<b>' + mistake + '</b> => ' + problem.value[mistake].join(', ') + '<br>'
        }

        addItem('ser-table', [result.rows[index].row + 1, line + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].lines[line]), element.slice(0, -4)])
      }
    } else {
      $('.ser-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.spacedNTags.length) {
      for (let problem of result.problems.spacedNTags) {
        index = problem.index
        addItem('snt-table', [result.rows[index].row + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), decodeHTML(result.rows[index].text), problem.value.join(', ')])
      }
    } else {
      $('.snt-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    if (result.problems.unnecessarySpaces.length) {
      for (let problem of result.problems.unnecessarySpaces) {
        index = problem.index
        line = problem.line
        addItem('usp-table', [result.rows[index].row + 1, line + 1, convertMS(result.rows[index].start), convertMS(result.rows[index].end), SubStationAlpha ? (!line ? decodeHTML(result.rows[index].lines[line].trimEnd()) : line === result.rows[index].lines.length - 1 ? decodeHTML(result.rows[index].lines[line].trimStart()) : decodeHTML(result.rows[index].lines[line].trim())) : decodeHTML(result.rows[index].lines[line]), problem.value.join(', ')])
      }
    } else {
      $('.usp-table')
        .parent()
        .parent(':not(.hidden)')
        .find('.segment')
        .dimmer('show')
        .dimmer({ closable: false })
    }

    $('.report-tabs > .tab .item[data-tab="technical/cps"]:not(.hidden)').text('CPS (' + $('.cps-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="technical/cpl"]:not(.hidden)').text('CPL (' + $('.cpl-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="technical/ndu"]:not(.hidden)').text('NDU (' + $('.ndu-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="technical/oli"]:not(.hidden)').text('OLI (' + $('.oli-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="syntax/ita"]:not(.hidden)').text('ITA (' + $('.ita-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="syntax/une"]:not(.hidden)').text('UNE (' + $('.une-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="semantic/ser"]:not(.hidden)').text('SER (' + $('.ser-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="semantic/snt"]:not(.hidden)').text('SNT (' + $('.snt-table tbody tr').length + ')')
    $('.report-tabs > .tab .item[data-tab="semantic/usp"]:not(.hidden)').text('USP (' + $('.usp-table tbody tr').length + ')')

    resolve(true)
  })
}
