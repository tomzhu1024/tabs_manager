import React, {useEffect, useState} from "react";
import RichEditor from 'rich-markdown-editor';
import {v1} from 'uuid';
import {Button, Input, Modal} from 'antd';
import debounce from 'lodash.debounce';
import {resetLastEditorId, restore, save, setLastEditorId, update} from "./storage";
import {NotesManager} from "./noteManager";
import "../../css/note.less";
import addIcon from "../../assets/add.png";

class PreviewBlock extends React.Component {

    changeHandler = debounce((value) => {
        const content = value();
        save({data: content, date: Date.now(), title: this.state.title}, this.props.id);
    }, 500);

    constructor(props) {
        super(props);
        this.state = {text: '', date: '', title: '', visible: false};
    }

    componentDidMount() {
        restore(this.props.id).then((it) => {
            this.setState({
                title: it[this.props.id].title,
                date: it[this.props.id].date
            });
        });
    }

    handleClick = () => {
        restore(this.props.id).then((it) => {
            this.setState({
                visible: true,
                text: it[this.props.id].data,
                date: Date.now(),
                title: it[this.props.id].title
            });
        });
    }

    convertDate = () => {
        if (!this.state.date) return '0-hour ago';
        const d = new Date(this.state.date);
        const now = new Date();
        if (now - d < 86400000) return `${Math.ceil((now - d) / 3600000)}-hour ago`;
        else if (now - d < 259200000) return `${Math.ceil((now - d) / 86400000)}-day ago`;
        else return `${d.getDate()} / ${d.getMonth} / ${d.getFullYear()}`;
    }

    handleModalOk = () => {
        restore(this.props.id).then((it) => {
            const tempTitle = this.state.title ? this.state.title : it[this.props.id].data.substr(0, 6)
            this.setState({visible: false, title: tempTitle});
            update({title: tempTitle}, this.props.id);
        });
    }

    handleDelete = () => {
        this.props.handleDelete(this.props.id);
        this.setState({visible: false});
    }

    render() {
        return (
            <>
                <Modal
                    title={<Input placeholder="Put title here" onChange={(e) => this.setState({title: e.target.value})}
                                  defaultValue={this.state.title}/>}
                    className="note-editor-modal"
                    visible={this.state.visible}
                    closable={false}
                    keyboard={false}
                    destroyOnClose={true}
                    onOk={this.handleModalOk}
                    footer={[
                        <Button key="save" type="primary" onClick={this.handleModalOk}>
                            save
                        </Button>,
                        <Button key="delete" danger onClick={this.handleDelete}>
                            delete
                        </Button>,
                    ]}
                >
                    <div style={{
                        height: '300px',
                        overflow: 'scroll'
                    }}>
                        <RichEditor
                            defaultValue={this.state.text}
                            onChange={this.changeHandler}
                        />
                    </div>
                </Modal>
                <div className="note-preview-block" onClick={this.handleClick}>
                    <span className="title"> {this.state.title ? this.state.title : 'Click me to edit'} </span>
                    <span className="date"> {this.convertDate()} </span>
                </div>
            </>
        )
    }
}

export function Notes() {
    const [notes, setNotes] = useState([]);
    const [id, setId] = useState('');

    const noteManager = new NotesManager();

    const updateNotes = (handler) => noteManager.getNotes().then((notes) => {
        if (handler) handler(notes);
        setNotes(notes);
    });

    const handleAdd = async () => {
        const tempId = v1();

        await noteManager.addOne(tempId);
        setId(tempId);
        updateNotes((notes) => {
            setId(notes[notes.length - 1]);
            setLastEditorId(notes[notes.length - 1]);
        });
    };

    useEffect(() => {
        updateNotes();
    }, [id]);

    const handleDelete = async (id) => {
        resetLastEditorId();
        await noteManager.deleteOne(id);
        updateNotes((notes) => {
            setId(notes[0]);
            setLastEditorId(notes[0]);
        });
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end'
            }}>
                <img
                    style={{cursor: "pointer"}}
                    onClick={handleAdd}
                    src={addIcon}
                />
            </div>
            {
                notes.length == 0 &&
                <div className="no-notes">
                    <p>Press the <span>+</span> to add a note!</p>
                </div>
            }
            {
                notes.map((note) => {
                    return <PreviewBlock id={note} handleDelete={handleDelete} setId={setId}/>
                })
            }
        </div>
    )
}