import './DocumentWindow.css'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type documentWindowProps = {
    id: number
    title: string 
}

function DisplayDocumentWindow(props: documentWindowProps){
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p></p>'
    })
    return <div className='documentWindow'>
        
        <header>
            <strong>{props.id}</strong>--
            {props.title}
        </header>

        <div>
            <EditorContent editor={editor}></EditorContent>
        </div>
    </div>
}

export default DisplayDocumentWindow