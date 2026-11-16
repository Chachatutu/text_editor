
import './App.css'
import { useState } from 'react'
import DisplayDocumentWindow from './DocumentWindow'

function App() {
  type stateName = 'file' | 'text' | 'window' | null
  const [openMenu, setOpenMenu] = useState<stateName>(null)


  type DocumentInformation = {
    id: number
    title: string
  }
  const [currentDocument, setcurrentDocument] = useState<DocumentInformation | null>(null)

  return (
    <div className="app">
      <header className="menu-bar">

        <div className='menu-group'>
          <button className='file' type="button" onClick={() => toggleVisibility('file')}>文件</button>
          {openMenu==='file' && 
            <div className='file-floating-panel'>
              <button type="button" onClick={createDocument}>新建</button>
              <button type="button">保存</button>
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
              <button type="button">水平平铺</button>
              <button type="button">垂直平铺</button>
            </div>
          }
        </div>

      </header>

      <main className="workspace">

        <div>
          {currentDocument === null &&
            <p>
              暂无文档
            </p>          
          }
          {currentDocument !== null &&
            <p>
              <strong>{currentDocument.id}</strong>--
              {currentDocument.title}
            </p>
          }
        </div>

        <div>
          {currentDocument !==null &&
            <DisplayDocumentWindow id={currentDocument.id} title={currentDocument.title} key={currentDocument.id} />
          }
        </div>
        
      </main>
    </div>
  )


  function toggleVisibility(menu: 'file' | 'text' | 'window') {
    if(menu === openMenu) setOpenMenu(null)
    else                  setOpenMenu(menu)
  }



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
    setcurrentDocument({id: result["id"], title: result["title"]}) 
    setOpenMenu(null)
    console.log(result)
  }

}

export default App
