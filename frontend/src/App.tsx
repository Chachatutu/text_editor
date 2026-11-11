
import './App.css'
import { useState } from 'react'


function App() {
  type stateName = 'file' | 'text' | 'window' | null
  const [openMenu, setOpenMenu] = useState<stateName>(null)

  return (
    <div className="app">
      <header className="menu-bar">

        <div className='menu-group'>
          <button className='file' type="button" onClick={() => toggleVisibility('file')}>文件</button>
          {openMenu==='file' && 
            <div className='file-floating-panel'>
              <button type="button">新建</button>
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
        <p>工作区</p>
      </main>
    </div>
  )


  function toggleVisibility(menu: 'file' | 'text' | 'window') {
    if(menu === openMenu) setOpenMenu(null)
    else                  setOpenMenu(menu)
  }

}

export default App
