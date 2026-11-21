
import './App.css'
import { useState } from 'react'
import DisplayDocumentWindow from './DocumentWindow'
import type { Editor, JSONContent } from '@tiptap/react'

function App() {
  type stateName = 'file' | 'text' | 'window' | null
  const [openMenu, setOpenMenu] = useState<stateName>(null)


  type DocumentInformation = {
    id: number
    title: string
    content: JSONContent
  }
  const [activeDocumentId, setActiveDocumentId] = useState<number>(-1)
  const [documents, setDocuments] = useState<DocumentInformation[]>([])

  type directionType = 'row' | 'column'
  const [direction, setDirection] = useState<directionType>('row')

  return (
    <div className="app">
      <header className="menu-bar">

        <div className='menu-group'>
          <button className='file' type="button" onClick={() => toggleVisibility('file')}>文件</button>
          {openMenu==='file' && 
            <div className='file-floating-panel'>
              <button type="button" onClick={createDocument}>新建</button>
              <button type="button" onClick={() => saveDocument(activeDocumentId)}>保存</button>
              <button type="button">打开</button>
            </div>
          } 
        </div>

        <div className='menu-group'>
          <button className='text' type="button" onClick={() => toggleVisibility('text')}>文字</button>
          {openMenu==='text' && 
            <div className='text-floating-panel'>
              <button type="button">粗体</button>
              <button type="button">斜体</button>
              <button type="button">下划线</button>
            </div>
          }
        </div>

        <div className='menu-group'>
          <button className='window' type="button" onClick={() => toggleVisibility('window')}>窗体</button>
          {openMenu==='window' && 
            <div className='window-floating-panel'>
              <button type="button">窗口层叠</button>
              <button type="button" onClick={() => setDirection('row')}>水平平铺</button>
              <button type="button" onClick={() => setDirection('column')}>垂直平铺</button>
            </div>
          }
        </div>

      </header>

      <main className="workspace">

        <div>
          {
            documents.map(
              doc => (
                <div key={doc.id}>
                  {doc.id}--{doc.title}
                </div>
              )
            )
          }
        </div>

        <div className={`windows ${direction}`}>
          {
            documents.map(
              doc => (
                <DisplayDocumentWindow
                key={doc.id}
                id={doc.id}
                title={doc.title}
                onEditorUpdate={(event) => { return whenTextChanged(event, doc.id)}}
                onActive={() => {return whenSelect(doc.id)}}
                isActive={doc.id===activeDocumentId}
                />
              )
            )
          }
        </div>
        
      </main>
    </div>
  )

  //菜单栏
  function toggleVisibility(menu: 'file' | 'text' | 'window') {
    if(menu === openMenu) setOpenMenu(null)
    else                  setOpenMenu(menu)
  }


  //新建文件
  async function createDocument() {
    const data = {
      title: "未命名文档",
      content: {
        type: 'doc',
        content: [ { type: 'paragraph' } ]
      }
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

    const address = `/api/documents/${id}`
    const targetDoc = documents.find( 
      (doc) => {
        if(doc.id === id) return true
        return false
      }
    )

    if(!targetDoc) return 

    try{
      const response = await fetch(
        address,
        {
          method:'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({title: targetDoc.title, content: targetDoc.content})
        }
      )

      if(!response.ok){
      console.error("保存失败")
      return
      }
      else{
        const result = await response.json()
        console.log('保存成功', result)
      }
    }
    catch(error){
      console.error('保存失败', error)
    }

  }

  //在列表documents中增加文件
  function appendDocuments(newDoc: DocumentInformation){
    setDocuments(previous => [...previous, newDoc])
  }
    
}

export default App
