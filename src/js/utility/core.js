/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

function loadLanguage () {
  return new Promise((resolve, reject) => {
    let lang = localStorage.getItem('lang')

    $('[data-langCode="' + lang + '"]').addClass('selected')

    if (lang === 'en') {
      i18n = {}

      $('[data-lang]').each(function () {
        if ($(this).attr('data-lang')) {
          if ($(this).attr('placeholder')) {
            $(this).attr('placeholder', $(this).attr('data-lang'))
          } else if ($(this).attr('data-tooltip')) {
            $(this).attr('data-tooltip', $(this).attr('data-lang'))
          } else {
            $(this).text($(this).attr('data-lang'))
          }

          $(this).attr('data-lang', '')
        }
      })

      resolve(true)
    } else {
      fs.readFile(path.join(ipcRenderer.sendSync('GetAppPath'), '/langs/' + lang + '.json'), 'utf-8').then(data => {
        try {
          i18n = JSON.parse(data)
        } catch (err) {
          return showMesssageToast(err.message)
        }

        $('[data-lang]').each(function () {
          let text

          if ($(this).attr('data-lang')) {
            text = $(this).attr('data-lang')
          } else {
            if ($(this).attr('placeholder')) {
              text = $(this)
                .attr('placeholder')
                .trim()

              $(this).attr('placeholder', i18n[text])
            } else if ($(this).attr('data-tooltip')) {
              text = $(this)
                .attr('data-tooltip')
                .trim()

              $(this).attr('data-tooltip', i18n[text])
            } else {
              text = $(this)
                .text()
                .trim()
                .replace(/\n+/g, '')

              $(this).text(i18n[text])
            }

            $(this).attr('data-lang', text)
          }
        })

        resolve(true)
      })
    }
  })
}

function convertToLanguage (text) {
  return text in i18n ? i18n[text] : text
}

function showMesssageToast (message) {
  if (!$('.message-toast').hasClass('is-open')) {
    $('.message-toast p').html(message)
    $('.message-toast').css('z-index', 2)
    $('.message-toast').addClass('is-open')
    setTimeout(() => {
      $('.message-toast').removeClass('is-open')
      setTimeout(() => {
        $('.message-toast').removeAttr('style')
      }, 300)
    }, 3200)
  }
}

function nextStep () {
  return new Promise((resolve, reject) => {
    let parent = $('.steps')

    parent.find('.step:eq(' + step + ')').animate({ left: '-100%' }, 500, function () {
      $(this)
        .removeClass('visible')
        .removeAttr('style')
    })

    step = ++step % 5

    parent
      .find('.step:eq(' + step + ')')
      .css('left', '100%')
      .addClass('visible')
    parent.find('.step:eq(' + step + ')').animate({ left: '0%' }, 500, function () {
      $(this).removeAttr('style')
      resolve(true)
    })

    if (step % 2 === 0) {
      if (step) {
        $('.step-pagination .bullet:eq(' + parseInt(step / 2 - 1) + ')').removeClass('active')
      } else {
        $('.step-pagination .bullet:last-child').removeClass('active')
      }
      $('.step-pagination .bullet:eq(' + parseInt(step / 2) + ')').addClass('active')
    }
  })
}

function prevStep () {
  return new Promise((resolve, reject) => {
    let parent = $('.steps')

    $('.step-pagination .bullet:eq(' + parseInt(step / 2) + ')').removeClass('active')

    parent.find('.step:eq(' + step + ')').animate({ left: '100%' }, 500, function () {
      $(this)
        .removeClass('visible')
        .removeAttr('style')
    })

    step -= 2
    step = step >= 0 ? step : 4

    parent
      .find('.step:eq(' + step + ')')
      .css('left', '-100%')
      .addClass('visible')
    parent.find('.step:eq(' + step + ')').animate({ left: '0%' }, 500, function () {
      $(this).removeAttr('style')
      resolve(true)
    })

    $('.step-pagination .bullet:eq(' + parseInt(step / 2) + ')').addClass('active')
  })
}

function statusAnimation () {
  setTimeout(() => {
    let top = parseInt($('.progress-status .status-box').css('top')) + 35
    $('.progress-status .status-box').css('top', top)
  }, 500)

  let timer = () => {
    let top = parseInt($('.progress-status .status-box').css('top'))
    if (top < 0) {
      setTimeout(() => {
        let top = parseInt($('.progress-status .status-box').css('top')) + 35
        $('.progress-status .status-box').css('top', top)
        timer()
      }, 2500)
    }
  }
  timer()
}

function sleep (millisecond) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true)
    }, millisecond)
  })
}

function pass () {
  return new Promise((resolve, reject) => {
    resolve(true)
  })
}

function calculateNumGrade (rows) {
  let max = rows.length
  let total = 0
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].grade > 20) {
      total += 2
    } else if (rows[i].grade > 0) {
      total++
    }
  }

  return 100 - Math.round((total / max) * 100)
}

function getAlphaGrade (grade) {
  if (grade > 97) {
    grade = 'A+'
  } else if (grade > 94) {
    grade = 'A'
  } else if (grade > 90) {
    grade = 'A-'
  } else if (grade > 86) {
    grade = 'B+'
  } else if (grade > 82) {
    grade = 'B'
  } else if (grade > 78) {
    grade = 'B-'
  } else if (grade > 74) {
    grade = 'C+'
  } else if (grade > 69) {
    grade = 'C'
  } else if (grade > 64) {
    grade = 'C-'
  } else if (grade > 59) {
    grade = 'D+'
  } else if (grade > 54) {
    grade = 'D'
  } else if (grade > 50) {
    grade = 'D-'
  } else {
    grade = 'F'
  }

  return grade
}

function convertMS (milliseconds) {
  return new Date(milliseconds)
    .toISOString()
    .slice(11, -1)
    .replace('.', ',')
}

function decodeHTML (text) {
  return $('<textarea>')
    .html(text)
    .html()
}

function addItem (table, item) {
  let $table = $('.' + table)

  for (let i = 0; i < item.length; i++) {
    item[i] = '<td>' + item[i] + '</td>'
  }

  $table.find('tbody').append('<tr>' + item.join('') + '</tr>')
}

function changeSection (section) {
  $('.left-sidemenu .item.active').removeClass('active')
  $('.left-sidemenu .item[data-section="' + section + '"]').addClass('active')

  $('.right-sections .section.active').removeClass('active')
  $('.right-sections .section[data-section="' + section + '"]').addClass('active')
}

function updateCombobox (dictionaries, selected) {
  let $combobox = $('.dictionaries-combobox')
  let list = []

  list.push({
    value: 'new',
    name: '<i class="plus icon"></i>' + convertToLanguage('New One')
  })

  for (let i = 0; i < dictionaries.length; i++) {
    list.push({
      value: i,
      name: '<i class="book icon"></i>' + dictionaries[i].title
    })
  }

  $combobox.dropdown('change values', list).dropdown('set selected', selected)
}

function updateTitle (title) {
  let $titleInput = $('.title-input')
  $titleInput.val(title.trim())
}

function updateWordList (words) {
  let $wordList = $('.word-list')
  let $noWord = $('.no-word')

  $wordList.find('.item').remove()

  if (words.length) {
    let element

    for (let word of words) {
      element = $('<div class="ui checkbox"></div>')
        .append('<input type="checkbox" /><label>' + word + '</label>')
        .wrap('<div class="item"></div>')
      element.checkbox()
      $wordList.append(element.parent())
    }

    $wordList.removeClass('hidden')
    $noWord.addClass('hidden')
  } else {
    $wordList.addClass('hidden')
    $noWord.removeClass('hidden')
  }
}

function updateDictionaryList (dictionaries) {
  let $dictionaryList = $('.dictionary-list')
  let $noDictionary = $('.no-dictionary')

  $dictionaryList.find('.item').remove()

  if (dictionaries.length) {
    let element

    for (let i = 0; i < dictionaries.length; i++) {
      element = $('<div class="ui checkbox"></div>')
        .append('<input type="checkbox" /><label>' + dictionaries[i].title + '</label>')
        .wrap($('<div class="item"></div>').attr('data-index', i))
      element.checkbox()
      $dictionaryList.append(element.parent())
    }

    $dictionaryList.removeClass('hidden')
    $noDictionary.addClass('hidden')
  } else {
    $dictionaryList.addClass('hidden')
    $noDictionary.removeClass('hidden')
  }
}

function updateStyleList (styles) {
  let $styleList = $('.style-list')

  $styleList.find('.item').remove()

  if (styles.length > 1) {
    let element

    for (let style of styles) {
      element = $('<div class="ui checkbox"></div>')
        .append('<input type="checkbox" /><label>' + style + '</label>')
        .wrap('<div class="item"></div>')
      element.checkbox()
      $styleList.append(element.parent())
    }

    $('.srt-second-tab-title').addClass('hidden')
    $('.ssa-second-tab-title').removeClass('hidden')
    $('.srt-second-tab-description').addClass('hidden')
    $('.ssa-second-tab-description').removeClass('hidden')
    $('.choose-box .grid')
      .removeClass('one column')
      .addClass('two column')
    $('.choose-box .divider').removeClass('hidden')
    $('.choose-box .grid .column:last-child').removeClass('hidden')
  } else {
    $('.srt-second-tab-title').removeClass('hidden')
    $('.ssa-second-tab-title').addClass('hidden')
    $('.srt-second-tab-description').removeClass('hidden')
    $('.ssa-second-tab-description').addClass('hidden')
    $('.choose-box .grid')
      .removeClass('two column')
      .addClass('one column')
    $('.choose-box .divider').addClass('hidden')
    $('.choose-box .grid .column:last-child').addClass('hidden')
  }
}

ipcRenderer.on('CloseSaveDialog', (event, arg) => {
  if (arg) {
    let report = []
    let today = new Date()

    report.push('[' + convertToLanguage('SubCritic Report File') + ']')
    report.push(convertToLanguage('Subtitle') + ': ' + assessment.fileName + '.' + (SubStationAlpha ? 'ass' : 'srt'))
    report.push(convertToLanguage('Total Line Count') + ': ' + assessment.totalLineCount)
    report.push(convertToLanguage('Checked Line Count') + ': ' + assessment.checkedLineCount)
    report.push(convertToLanguage('Date') + ': ' + today.toLocaleDateString())
    report.push(convertToLanguage('Time') + ': ' + today.toLocaleTimeString())
    report.push('')
    report.push('[' + convertToLanguage('Found') + ']')
    report.push('CPS (' + convertToLanguage('Characters Per Second') + '): ' + assessment.CPS)
    report.push('CPL (' + convertToLanguage('Characters Per Line') + '): ' + assessment.CPL)
    report.push('SER (' + convertToLanguage('Spelling Errors') + '): ' + assessment.SER)
    if (SubStationAlpha) {
      report.push('SNT (' + convertToLanguage('Spaced N Tags') + '): ' + assessment.SNT)
    }
    report.push('ITA (' + convertToLanguage('Invalid Tags') + '): ' + assessment.ITA)
    report.push('NDU (' + convertToLanguage('Negative Durations') + '): ' + assessment.NDU)
    if (!SubStationAlpha) {
      report.push('UNE (' + convertToLanguage('Unsupported Newlines') + '): ' + assessment.UNE)
      report.push('OLI (' + convertToLanguage('Overlapping Lines') + '): ' + assessment.OLI)
    }
    report.push('USP (' + convertToLanguage('Unnecessary Spaces') + '): ' + assessment.USP)
    report.push(convertToLanguage('Total') + ': ' + (assessment.CPS + assessment.CPL + assessment.SER + assessment.SNT + assessment.ITA + assessment.NDU + assessment.UNE + assessment.OLI + assessment.USP))
    report.push(convertToLanguage('Grade') + ': ' + assessment.grade)

    if (assessment.dictionaries.length) {
      report.push('')
      report.push('[' + convertToLanguage('Used Dictionaries') + ']')
      report.push(convertToLanguage('Format') + ': ' + convertToLanguage('Title, Word Count, Words'))

      for (let i = 0; i < assessment.dictionaries.length; i++) {
        report.push(assessment.dictionaries[i].title + ', ' + assessment.dictionaries[i].words.length + ', ' + assessment.dictionaries[i].words.join(', '))
      }
    }

    $('table').each(function () {
      if ($(this).find('tbody tr').length) {
        report.push('')
        report.push(
          '[' +
            $(this)
              .parent()
              .parent()
              .attr('data-tab')
              .split('/')
              .pop()
              .toUpperCase() +
            ']'
        )
        report.push(convertToLanguage('Format') + ': ')

        $(this)
          .find('thead tr th')
          .each(function () {
            report[report.length - 1] += $(this).text() + ', '
          })

        report[report.length - 1] = report[report.length - 1].slice(0, -2)

        $(this)
          .find('tbody tr')
          .each(function () {
            report.push('')
            $(this)
              .find('td')
              .each(function () {
                report[report.length - 1] +=
                  $('<div>')
                    .html(
                      $(this)
                        .html()
                        .replace('<br>', ' | ')
                    )
                    .text() + ', '
              })
            report[report.length - 1] = report[report.length - 1].slice(0, -2)
          })
      }
    })

    fs.writeFile(arg, report.join('\r\n'))
      .then(data => {
        showMesssageToast(convertToLanguage('Report saved'))
      })
      .catch(err => {
        showMesssageToast(err.message)
      })
  }
})
