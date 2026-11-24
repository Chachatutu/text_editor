import './App.css'
import { useState } from 'react'
import DisplayDocumentWindow from './DocumentWindow'
import { Editor, type JSONContent } from '@tiptap/react'
import { useRef } from 'react'


function App() {
  type menuState = 'file' | 'text' | 'typeface' | 'window' | null
  const [openMenu, setOpenMenu] = useState<menuState>(null)


  type DocumentInformation = {
    id: number
    title: string
    content: JSONContent
  }
  const [activeDocumentId, setActiveDocumentId] = useState<number>(-1)
  const [documents, setDocuments] = useState<DocumentInformation[]>([])

  type layoutType = 'row' | 'column' | 'stacking'
  const [layout, setLayout] = useState<layoutType>('row')

  const editors = useRef(new Map<number, Editor>())
  const handlesRef = useRef(new Map<number, FileSystemFileHandle>())

  type databaseDocInfo = {
    id: number
    title: string 
  }
  const [Choices, setChoices] = useState<databaseDocInfo[] | null>(null)
  return (
    <div className="app">
      <header className="menu-bar">

        <div className='menu-group'>
          <button className='file' type="button" onClick={() => toggleVisibility('file')}>文件</button>
          {openMenu==='file' && 
            <div className='file-floating-panel'>
              <button type="button" onClick={() => createRecord('未命名文档', {type: 'doc', content: [{type: 'paragraph'}]})}>新建</button>
              <button type="button" onClick={() => saveDocument(activeDocumentId)}>保存</button>
              <button type="button" onClick={openLocalFile}>从本地打开</button>
              <button type='button' onClick={openDatabaseFileList}>从数据库打开</button>
            </div>
          } 
        </div>

        <div className='menu-group'>
          <button className='text' type="button" onClick={() => toggleVisibility('text')}>字体</button>
          {openMenu==='text' && 
            <div className='text-floating-panel'>
              <button type="button" onClick={ () => setFont(activeDocumentId,'bold')}>粗体</button>
              <button type="button" onClick={ () => setFont(activeDocumentId,'italic')}>斜体</button>
              <button type="button" onClick={ () => setFont(activeDocumentId,'underline')}>下划线</button>
            </div>
          }
        </div>
        
        <div className='menu-group'>
          <button className='typeface' type='button' onClick={() => toggleVisibility('typeface')}>字型</button>
          {openMenu==='typeface' &&
            <div className='typeface-floating-panel'>
              <button type='button' onClick={() => setTypeface(activeDocumentId, 'Microsoft YaHei')}>微软雅黑</button>
              <button type='button' onClick={() => setTypeface(activeDocumentId, 'SimSun')}>宋体</button>
            </div>
          }
        </div>

        <div className='menu-group'>
          <button className='window' type="button" onClick={() => toggleVisibility('window')}>窗体</button>
          {openMenu==='window' && 
            <div className='window-floating-panel'>
              <button type="button" onClick={() => setLayout('stacking')}>窗口层叠</button>
              <button type="button" onClick={() => setLayout('row')}>水平平铺</button>
              <button type="button" onClick={() => setLayout('column')}>垂直平铺</button>
            </div>
          }
        </div>

      </header>

      <main className="workspace">

        <div>
          {Choices===null && 
            documents.map(
              doc => (
                <div key={doc.id}>
                  {doc.id}--{doc.title}
                </div>
              )
            )
          }
          {Choices!==null &&
            <>
              <button type='button' onClick={() => setChoices(null)}>关闭</button>
              {Choices.map(
                databaseDoc => (
                  <button type='button' onClick={() => chooseDatabaseFile(databaseDoc.id)}>{databaseDoc.id}--{databaseDoc.title}</button>
                )
              )}
            </>
          }
        </div>

        <div className={`windows ${layout}`}>
          {
            documents.map(
              (doc, index) => (
                <DisplayDocumentWindow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                onEditorUpdate={(event) => { return whenTextChanged(event, doc.id)}}
                onActive={() => {return whenSelect(doc.id)}}
                isActive={doc.id===activeDocumentId}
                offset={index * 28}
                insertEditor={insertEditor}
                removeEditor={removeEditor}
                initialContent={doc.content}
                />
              )
            )
          }
        </div>
        
      </main>
    </div>
  )

  //菜单栏
  function toggleVisibility(menu: 'file' | 'text' | 'typeface' | 'window') {
    if(menu === openMenu) setOpenMenu(null)
    else                  setOpenMenu(menu)
  }


  //新建记录
  async function createRecord(title: string, content: JSONContent) {
    const data = {
      title: title,
      content: content
    }

    const response = await fetch(
        '/api/documents',
        {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      )
    if(!response.ok){
      console.error("创建失败", response.status)
      return 
    }
    const result = await response.json()
    setActiveDocumentId(result["id"]) 
    appendDocuments({id: result["id"], title: result["title"], content: result["content"]})
    setOpenMenu(null)
    console.log(result)
    return result
  }

  //当文本发生变化
  function whenTextChanged(event: { editor: Editor}, id:number) {
    const updatedContent = event.editor.getJSON()
    
    setDocuments(
      (previous) => {
        const nextStatus = previous.map(
          doc => {
            if(doc.id === id){
              return {
                ...doc,
                content: updatedContent
              }
            }
            return doc
          }
        )
        return nextStatus
      }
    )
    setActiveDocumentId(id)
  }

  function whenSelect(id: number){
    setActiveDocumentId(id)
  }

  //保存
  async function saveDocument(id: number) {  
    if(id === -1) return
    const targetDoc = documents.find(doc => doc.id===id)
    const targetEditor = editors.current.get(id)
    if(!targetEditor || !targetDoc) return 
    let title = targetDoc.title
    const content = targetEditor.getJSON()
    const text = targetEditor.getText({blockSeparator:'\n'})

    const response = await saveInLocal(id, text, title)
    if(response === null){
      console.error("本地未成功保存")
      return
    }
    console.log("本地已保存")
    title = response
    const databaseSaved = await saveInDatabase(id, content, title)
    if(!databaseSaved){
      console.error("数据库未成功保存")
      return
    }
    console.log("本地和数据库均已保存")
    return
  }  
  async function saveInLocal(id: number, text: string, title: string) {
    let handle = handlesRef.current.get(id)
    if(!handle) {
      try{
        handle = await window.showSaveFilePicker({
          suggestedName: `${title}.txt`,
          types: [
              {
                  description: '文本文件',
                  accept: {
                      'text/plain': ['.txt'],
                  },
              },
          ],
        })
      }
      catch(error){
        console.error("本地--取消保存", error)
        return null
      }
    }
    try{
      const writable = await handle.createWritable()
      await writable.write(text)
      await writable.close()
    }
    catch(error){
      console.error("本地--写入失败", error)
      return null
    }
    handlesRef.current.set(id, handle)
    console.log("成功保存到本地")
    setDocuments(
      previous => previous.map(
        doc => {
          if(doc.id === id){
            return {
              ...doc,
              title: handle.name
            }
          }
          return doc
        }
      )
    )
    return handle.name
  }
  async function saveInDatabase(id: number, content: JSONContent, title: string) {
    const address = `/api/documents/${id}`
    try{
      const response = await fetch(
        address,
        {
          method:'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({title: title, content: content})
        }
      )

      if(!response.ok){
      console.error("数据库--保存失败")
      return 0
      }
      else{
        const result = await response.json()
        console.log('数据库--保存成功', result)
        return 1
      }

    }
    catch(error){
      console.error('数据库--保存失败', error)
      return 0
    }
  }



  //在列表documents中增加文件
  function appendDocuments(newDoc: DocumentInformation){
    setDocuments(
      previous => {
        if(previous.some(doc => doc.id===newDoc.id)) return previous
        return [...previous, newDoc]
      }
    )
  }
    
  function insertEditor(id: number, editor: Editor){
    editors.current.set(id,editor)
    console.log('登记编辑器', id, [...editors.current.keys()])
  }
  function removeEditor(id: number){
    console.log('准备删除编辑器', id)
    editors.current.delete(id)
    console.log('删除后的编号', [...editors.current.keys()])
  }

  //设置字体
  function setFont(id: number, Font: 'bold' | 'italic' | 'underline'){
    const targetEditor = editors.current.get(id) 

    console.log('设置字体', {
        id,
        editor: targetEditor,
        registeredIds: [...editors.current.keys()],
    })

    if(!targetEditor || targetEditor.isDestroyed) return
    if (targetEditor.state.selection.empty) return
    let result
    if(Font === 'bold') {
      result = targetEditor.chain().focus().toggleBold().run()
    } 
    if(Font === 'italic') {
      result = targetEditor.chain().focus().toggleItalic().run()
    }
    if(Font === 'underline') {
      result = targetEditor.chain().focus().toggleUnderline().run()
    }

    console.log('命令执行结果', result)

  }

  function setTypeface(id: number, family: string){
    const targetEditor = editors.current.get(id) 

    console.log('设置字型', {
        id,
        editor: targetEditor,
        registeredIds: [...editors.current.keys()],
    })

    if(!targetEditor || targetEditor.isDestroyed) return
    if (targetEditor.state.selection.empty) return
    const result = targetEditor.chain().focus().setFontFamily(family).run()
    console.log('命令执行结果', result)
  }
  async function openLocalFile() {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [
            {
              description: '文本文件',
              accept: {
                  'text/plain': ['.txt'],
              },
            },
        ],
      })
      const handle = handles[0]
      const file = await handle.getFile()
      const text = await file.text()
      console.log(file.name)
      console.log(text)
      const content = textToDocument(text)
      const document = await createRecord(file.name, content)
      if(!document) return
      handlesRef.current.set(document.id, handle)
    }
    catch(error){
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      console.error('打开失败', error)
    } 
  }
  
  function textToDocument(text: string): JSONContent{
    const lines = text.split(/\r\n|\n|\r/)
    const processedLines = lines.map(
      (s: string) => {
        if(s === ''){
          return {
            type: 'paragraph',
          }
        }
        else{
          return{
            type: 'paragraph',
            content: [{type: 'text', text: s}]
          }
        }
      }
    )
    const content = {
      type: 'doc',
      content: processedLines
    }
    return content
  }

  async function openDatabaseFileList(){
    const response = await fetch('/api/documents')
    if(!response.ok)  throw new Error(`读取列表失败：${response.status}`)
    const rows: databaseDocInfo[] = await response.json()
    setChoices(rows)
  }
  async function chooseDatabaseFile(id: number){
    const isAlreadyOpen = documents.some(doc => doc.id===id)
    if(isAlreadyOpen) whenSelect(id)
    else{
      const response = await fetch(`/api/documents/${id}`)
      if(!response.ok)  throw new Error(`读取文件内容失败：${response.status}`)
      const docInfo = await response.json()
      appendDocuments(docInfo)
    }
    whenSelect(id)
  }
}

export default App
