import './DocumentWindow.css'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
type documentWindowProps = {
    id: number
    title: string 
    onEditorUpdate: (event: { editor:Editor}) => void

    onActive: () => void
    isActive: boolean
}

function DisplayDocumentWindow(props: documentWindowProps){
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p></p>',
        onUpdate: props.onEditorUpdate
    })
    return <div className='documentWindow' onPointerDownCapture={props.onActive}>
        
        <header className={props.isActive? 'docHead active':'docHead'}>
            {props.id}--{props.title}
        </header>

        <div>
            <EditorContent editor={editor}></EditorContent>
        </div>
    </div>
}

export default DisplayDocumentWindow