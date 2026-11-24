import './DocumentWindow.css'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, FontFamily } from '@tiptap/extension-text-style'
import type { JSONContent } from '@tiptap/react'
type documentWindowProps = {
    id: number
    title: string 
    onEditorUpdate: (event: { editor:Editor}) => void

    onActive: () => void
    isActive: boolean
    offset: number

    insertEditor: (id: number, editor: Editor) => void
    removeEditor: (id: number) => void

    initialContent: JSONContent
}

function DisplayDocumentWindow(props: documentWindowProps){
    const editor = useEditor({
        extensions: [StarterKit, TextStyle, FontFamily],
        content: props.initialContent,
        onUpdate: props.onEditorUpdate,
        onCreate: (event) => { return props.insertEditor(props.id, event.editor) },
        onDestroy: () => { return props.removeEditor(props.id) }
        
    })

    return <div className={props.isActive? 'documentWindow active':'documentWindow'} 
                onPointerDownCapture={props.onActive} 
                style={ {left: props.offset, top: props.offset} }
            >
        <header>
            {props.id}--{props.title}
        </header>

        <div>
            <EditorContent editor={editor}></EditorContent>
        </div>
    </div>
}

export default DisplayDocumentWindow