import _ from 'lodash'
import { action } from 'mobx'
import { EditorPicker } from '@packages/ui-components'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'

import ipc from '../lib/ipc'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/global-settings')
}

const save = _.debounce((editor) => {
  ipc.setUserEditor(editor)
  .catch(() => {}) // ignore errors
}, 500)

const GlobalSettings = observer(() => {
  const state = useLocalStore(() => ({
    editors: [],
    isLoadingEditor: true,
    chosenEditor: {},
    setEditors: action((editors) => {
      state.editors = editors
      state.isLoadingEditor = false
    }),
    setChosenEditor: action((editor) => {
      state.chosenEditor = editor
      save(editor)
    }),
    setOtherPath: action((otherPath) => {
      const otherOption = _.find(state.editors, { isOther: true })

      otherOption.openerId = otherPath
      save(otherOption)
    }),
  }))

  useEffect(() => {
    ipc.getUserEditor().then(({ preferredEditor, availableEditors }) => {
      if (preferredEditor) {
        state.setChosenEditor(preferredEditor)
      }

      state.setEditors(availableEditors)
    })
  }, [true])

  return (
    <div className="global-settings">
      <a href='#' className='learn-more' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>

      <p className='text-muted'>Global settings take effect for every project on your system. Changing them here will change them for other projects as well.</p>
      <p><b>Editor Preference</b></p>
      <p>Your preferred editor is used to open files from the Test Runner <em>(e.g. when clicking links in error stack traces)</em></p>
      {state.isLoadingEditor ?
        <p className='loading-editors'>
          <i className='fas fa-spinner fa-spin'></i> Loading Editors...
        </p> :
        <EditorPicker
          chosen={state.chosenEditor}
          editors={state.editors}
          onSelect={state.setChosenEditor}
          onUpdateOtherPath={state.setOtherPath}
        />
      }
    </div>
  )
})

export default GlobalSettings
