import './DocumentWindow.css'

type documentWindowProps = {
    id: number
    title: string 
}

function DisplayDocumentWindow(props: documentWindowProps){
    return <div className='documentWindow'>
        
        <header>
            <strong>{props.id}</strong>--
            {props.title}
        </header>

        <div>

        </div>
    </div>
}

export default DisplayDocumentWindow