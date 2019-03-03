/* eslint-disable no-undef */

$(() => {
  loadLanguage()

  $('.sidebar .item').on('click', function () {
    let section = $(this).attr('data-section')

    changeSection(section)

    if (section === 'dictionaries') {
      if ($('.dictionaries-combobox').dropdown('get value') === '') {
        updateCombobox(JSON.parse(localStorage.getItem('dictionaries')), 'new')
      }
    }
  })

  $('a[href^="http"]').on('click', function (oEvent) {
    oEvent.preventDefault()
    oEvent.stopPropagation()

    ipcRenderer.send('OpenLink', $(this).attr('href'))
  })

  $('.drag-drop-area')
    .on('drag dragstart dragend dragover dragenter dragleave drop', function (oEvent) {
      oEvent.preventDefault()
      oEvent.stopPropagation()
    })
    .on('dragenter', function () {
      if (!$(this).hasClass('is-dragover')) {
        $(this).addClass('is-dragover')
      }
    })
    .on('dragleave drop', function () {
      if ($(this).hasClass('is-dragover')) {
        $(this).removeClass('is-dragover')
      }
    })
    .on('drop', function (oEvent) {
      let file = oEvent.originalEvent.dataTransfer.files[0]
      let name = file.name.split('.')
      let ext = file.name.indexOf('.') > -1 ? name.pop() : false

      if (ext && (ext === 'srt' || ext === 'ass' || ext === 'ssa')) {
        assessment.fileName = name.join('')

        nextStep()
          .then(
            data =>
              new Promise((resolve, reject) => {
                let reader = new FileReader()

                reader.readAsArrayBuffer(file)
                reader.onload = oEvent => {
                  data = oEvent.target.result
                  let arrayBuffer = new Uint8Array(data)
                  let encoding = detect(arrayBuffer).length ? detect(arrayBuffer)[0].charsetName : 'UTF-8'
                  data = new TextDecoder(encoding).decode(arrayBuffer)
                  resolve(data)
                }
                reader.onerror = oEvent => {
                  reader.abort()
                  reject(new Error(convertToLanguage("Couldn't open subtitle")))
                }
              })
          )
          .then(
            data =>
              new Promise((resolve, reject) => {
                if (ext === 'srt') {
                  try {
                    rows = srt.parse(data)
                    assessment.totalLineCount = rows.length

                    resolve(true)
                  } catch (err) {
                    reject(new Error(convertToLanguage("Couldn't parse this SubRip subtitle")))
                  }
                } else {
                  try {
                    let parsed = ssa.parse(data)
                    rows = parsed.events.dialogue
                    assessment.totalLineCount = rows.length
                    styles = parsed.styles.style

                    for (let i = 0; i < styles.length; i++) {
                      styles[i] = styles[i][0]
                    }

                    resolve(true)
                  } catch (err) {
                    reject(new Error(convertToLanguage("Couldn't parse this SubStation Alpha subtitle")))
                  }
                }
              })
          )
          .then(
            data =>
              new Promise((resolve, reject) => {
                SubStationAlpha = ext !== 'srt'

                updateDictionaryList(JSON.parse(localStorage.getItem('dictionaries')))
                updateStyleList(styles)

                for (let i = 0; i < rows.length; i++) {
                  rows[i].row = i
                }

                resolve(true)
              })
          )
          .then(data => nextStep())
          .catch(err => {
            showMesssageToast(err.message)
          })
      } else {
        showMesssageToast(convertToLanguage('Subtitle has to be SubRip or SubStation Alpha'))
      }
    })

  $('.back-button').on('click', () => {
    rows = []
    styles = []
    assessment = {}

    prevStep()
  })

  $('.continue-button').on('click', () => {
    new Promise((resolve, reject) => {
      if (styles.length > 1) {
        let $styleList = $('.style-list')

        if ($styleList.find('.item .checkbox.checked').length) {
          styles = []

          $styleList.find('.item .checkbox.checked').each(function () {
            styles.push(
              $(this)
                .find('label')
                .text()
            )
          })

          rows = rows.filter(row => styles.includes(row.Style))
          styles = []
        } else {
          reject(new Error(convertToLanguage("You didn't choose any style")))
        }
      }

      assessment.checkedLineCount = rows.length

      resolve(true)
    })
      .then(
        data =>
          new Promise((resolve, reject) => {
            let lang = localStorage.getItem('lang')

            $('.add-dictionary-button').addClass('disabled')
            $('.continue-button').addClass('disabled')
            $('.back-button').addClass('disabled')
            $('.choose-box').addClass('disabled-box')

            fs.readFile(path.join(ipcRenderer.sendSync('GetAppPath'), '/dics/' + lang + '/' + lang + '.aff'), 'utf-8').then(aff => {
              fs.readFile(path.join(ipcRenderer.sendSync('GetAppPath'), '/dics/' + lang + '/' + lang + '.dic'), 'utf-8').then(dic => {
                spellChecker = nspell(aff, dic)
                resolve(true)
              })
            })
          })
      )
      .then(
        data =>
          new Promise((resolve, reject) => {
            let dictionaries = JSON.parse(localStorage.getItem('dictionaries'))
            let $dictionaryList = $('.dictionary-list')
            let i

            assessment.dictionaries = []

            if ($dictionaryList.find('.item').length) {
              $dictionaryList.find('.item .checkbox.checked').each(function () {
                i = parseInt(
                  $(this)
                    .parent()
                    .attr('data-index')
                )

                assessment.dictionaries.push(dictionaries[i])

                for (let word of dictionaries[i].words) {
                  spellChecker.add(word)
                }
              })
            }

            resolve(true)
          })
      )
      .then(
        data =>
          new Promise((resolve, reject) => {
            $('.progress-bar').progress({
              showActivity: false,
              autoSuccess: false,
              value: 0,
              total: rows.length
            })

            $('.progress-status .status-box').css('top', '-' + $('.progress-status .status-box p').length * 35 + 'px')

            nextStep().then(data => {
              $('.add-dictionary-button').removeClass('disabled')
              $('.continue-button').removeClass('disabled')
              $('.back-button').removeClass('disabled')
              $('.choose-box').removeClass('disabled-box')

              statusAnimation()

              progress(rows).then(data => {
                rows = []
                spellChecker = null

                assessment.CPS = result.problems.charactersPerSecond.length
                assessment.CPL = result.problems.charactersPerLine.length
                assessment.NDU = result.problems.negativeDurations.length
                assessment.OLI = result.problems.overlappingLines.length
                assessment.ITA = result.problems.invalidTags.length
                assessment.UNE = result.problems.unsupportedNewLines.length
                assessment.SER = result.problems.spellingErrors.length
                assessment.SNT = result.problems.spacedNTags.length
                assessment.USP = result.problems.unnecessarySpaces.length

                report(result)
                  .then(
                    data =>
                      new Promise((resolve, reject) => {
                        result = {}
                        resolve(true)
                      })
                  )
                  .then(data => nextStep())
              })
            })
          })
      )
      .catch(err => {
        showMesssageToast(err.message)
      })
  })

  $('.again-report-button').on('click', () => {
    assessment = {}
    nextStep()
  })

  $('.save-report-button').on('click', () => {
    ipcRenderer.send('OpenSaveDialog', assessment.fileName + '.rpt')
  })

  $('.dictionaries-combobox').dropdown({
    onChange: function (value, text, $choice) {
      if (value !== '') {
        let dictionaries = JSON.parse(localStorage.getItem('dictionaries'))

        if (value === 'new') {
          dictionary = {
            title: '',
            words: []
          }

          $('.delete-dictionary-button').addClass('hidden')
        } else {
          dictionary = dictionaries[parseInt(value)]
          $('.delete-dictionary-button').removeClass('hidden')
        }

        updateTitle(dictionary.title)
        updateWordList(dictionary.words)
      }
    }
  })

  $('.title-input').on('keyup', function () {
    dictionary.title = getAlphabet(
      $(this)
        .val()
        .trim()
    )
  })

  $('.word-input').on('keyup', oEvent => {
    if (oEvent.keyCode === 13) {
      $('.add-word-button').click()
    }
  })

  $('.add-word-button').on('click', function () {
    let lang = localStorage.getItem('lang')
    let word = getAlphabet(
      $('.word-input')
        .val()
        .trim()
        .toLocaleLowerCase(lang)
    )

    if (word !== '') {
      if (word.length > 2) {
        if (word.split(' ').length === 1) {
          if (!dictionary.words.includes(word)) {
            dictionary.words.push(word)
            updateWordList(dictionary.words)

            $('.word-input')
              .val('')
              .focus()
          } else {
            showMesssageToast(convertToLanguage('Word is already present'))
          }
        } else {
          showMesssageToast(convertToLanguage('You can only write one word'))
        }
      } else {
        showMesssageToast(convertToLanguage('At least three characters needed'))
      }
    } else {
      showMesssageToast(convertToLanguage("You didn't enter any word"))
    }
  })

  $('.select-all-button').on('click', function () {
    $('.word-list .item .checkbox').each(function () {
      $(this).checkbox('set checked')
    })
  })

  $('.unselect-all-button').on('click', function () {
    $('.word-list .item .checkbox').each(function () {
      $(this).checkbox('set unchecked')
    })
  })

  $('.remove-word-button').on('click', function () {
    let $wordList = $('.word-list')
    let word

    $wordList.find('.item .checkbox').each(function () {
      if ($(this).hasClass('checked')) {
        word = $(this)
          .find('label')
          .text()

        dictionary.words.splice(dictionary.words.indexOf(word), 1)
      }
    })

    updateWordList(dictionary.words)
  })

  $('.add-dictionary-button').on('click', function () {
    changeSection('dictionaries')
    updateCombobox(JSON.parse(localStorage.getItem('dictionaries')), 'new')
  })

  $('.save-dictionary-button').on('click', () => {
    if (dictionary.title !== '' && dictionary.words.length) {
      let dictionaries = JSON.parse(localStorage.getItem('dictionaries'))
      let index = -1

      for (let i = 0; i < dictionaries.length; i++) {
        if (dictionaries[i].title === dictionary.title) {
          dictionaries[i].words = dictionary.words
          index = i
          break
        }
      }

      if (index === -1) {
        dictionaries.push(dictionary)
        index += dictionaries.length
      }

      localStorage.setItem('dictionaries', JSON.stringify(dictionaries))

      updateCombobox(dictionaries, index + '')
      updateDictionaryList(dictionaries)

      showMesssageToast(convertToLanguage('Dictionary added / updated'))
    } else {
      showMesssageToast(convertToLanguage('Title or word list cannot be empty'))
    }
  })

  $('.delete-dictionary-button').on('click', () => {
    let dictionaries = JSON.parse(localStorage.getItem('dictionaries'))
    let index = -1

    for (let i = 0; i < dictionaries.length; i++) {
      if (dictionary.title === dictionaries[i].title) {
        index = i
        break
      }
    }

    if (index !== -1) {
      dictionary = {
        title: '',
        words: []
      }

      dictionaries.splice(index, 1)
      localStorage.setItem('dictionaries', JSON.stringify(dictionaries))

      updateCombobox(dictionaries, 'new')
      updateTitle(dictionary.title)
      updateWordList(dictionary.words)
      updateDictionaryList(dictionaries)

      showMesssageToast(convertToLanguage('Dictionary removed'))
    }
  })

  $('.languages-box .card').on('click', function () {
    let langCode = $(this).attr('data-langCode')

    localStorage.setItem('lang', langCode)
    loadLanguage().then(data => {
      updateCombobox(JSON.parse(localStorage.getItem('dictionaries')), $('.dictionaries-combobox').dropdown('get value'))

      $('.languages-box .card').removeClass('selected')
      $(this).addClass('selected')

      let language = $(this)
        .find('.extra')
        .text()

      showMesssageToast(convertToLanguage('Language changed') + ': ' + language)
    })
  })
})
