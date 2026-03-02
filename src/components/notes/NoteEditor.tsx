import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { updateNote, Note } from '../../services/notesService';
import { fetchProjects, createQuickTask, Project, TaskSearchResult } from '../../api/projects';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

import { useNotePresence } from '@/hooks/useNotePresence';
import FixedToolbar from './FixedToolbar';
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { EditorHeader } from './editor/EditorHeader';
import { TaskDialogs } from './editor/TaskDialogs';
import { ShareDialog } from './editor/ShareDialog';

interface NoteEditorProps {
  note: Note;
  user: { uid: string; displayName?: string; email?: string; photoURL?: string };
  onUpdate: (note: Note) => void;
  className?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, user, onUpdate, className }) => {
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState(note.title || '');
  const [status, setStatus] = useState<'Saved' | 'Saving...'>('Saved');
  const [isEditable, setIsEditable] = useState(true);


  useEffect(() => {

    if (user.uid === note.ownerId) {
      setIsEditable(true);
      return;
    }


    const noteAny = note as any;
    const userRole = noteAny.permissions?.[user.uid] || noteAny.role;


    if (userRole === 'viewer') {
      setIsEditable(false);
    } else {

      setIsEditable(true);
    }
  }, [note, user.uid]);


  const {
    activeUsers,
    remoteCursors,
    updateCursorPosition,
    isConnected
  } = useNotePresence(note.id, user);


  const [projects, setProjects] = useState<Project[]>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskLinkDialogOpen, setTaskLinkDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTaskText, setSelectedTaskText] = useState("");


  const editorOptions = useMemo(() => ({
    initialContent: note.content && Array.isArray(note.content) && note.content.length > 0
      ? note.content
      : undefined,
  }), []);

  const editor = useCreateBlockNote(editorOptions);


  useEffect(() => {
    setTitle(note.title || '');
  }, [note.title]);


  useEffect(() => {
    if (user.uid) {
      fetchProjects(user.uid).then(setProjects).catch(e => console.error(e));
    }
  }, [user.uid]);

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {return;}
    const newTitle = e.target.value;
    setTitle(newTitle);
    setStatus('Saving...');
    try {
      await updateNote(note.id, { title: newTitle });
      setStatus('Saved');
      onUpdate({ ...note, title: newTitle });
    } catch (error) {
      console.error("Failed to save title", error);
    }
  };


  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback(() => {
    if (!isEditable) {return;}

    setStatus('Saving...');


    try {
      const cursorPos = editor.getTextCursorPosition();
      if (cursorPos?.block?.id) {
        updateCursorPosition(cursorPos.block.id);
      }
    } catch (e) {

    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const blocks = editor.document;
        await updateNote(note.id, { content: blocks });
        setStatus('Saved');
      } catch (error) {
        console.error("Failed to save content", error);
        toast.error("Failed to save changes");
      }
    }, 2000);
  }, [editor, note.id, updateCursorPosition, isEditable]);


  const handleBlockFocus = useCallback(() => {
    try {
      const cursorPos = editor?.getTextCursorPosition();
      if (cursorPos?.block?.id) {

        console.log('📤 [NoteEditor] I focused block:', cursorPos.block.id);
        updateCursorPosition(cursorPos.block.id);
      }
    } catch (e) {

    }
  }, [editor, updateCursorPosition]);


  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [note.id]);


  useEffect(() => {

    console.log('🎨 [NoteEditor] Block highlight effect running');
    console.log('🎨 [NoteEditor] activeUsers:', activeUsers.map(u => ({ id: u.id, name: u.name, blockId: u.blockId })));
    console.log('🎨 [NoteEditor] remoteCursors keys:', Object.keys(remoteCursors));
    console.log('🎨 [NoteEditor] remoteCursors full:', remoteCursors);

    if (!editor) {return;}


    const blocks = editor.document;


    console.log('🎨 [NoteEditor] All block IDs in document:', blocks.map(b => b.id));


    const remoteCursorKeys = Object.keys(remoteCursors);
    const blockIds = blocks.map(b => b.id);
    const matchingBlocks = blockIds.filter(id => remoteCursorKeys.includes(id));
    console.log('🎨 [NoteEditor] Block IDs that have remoteCursors:', matchingBlocks);


    const previousHighlights = document.querySelectorAll('[data-collab-user]');
    previousHighlights.forEach(el => {
      el.removeAttribute('data-collab-user');
      el.removeAttribute('data-collab-color');
      el.removeAttribute('data-collab-name');
      (el as HTMLElement).style.removeProperty('--collab-color');
    });

    if (activeUsers.length === 0) {
      console.log('🎨 [NoteEditor] No active users, all highlights cleared');
      return;
    }


    blocks.forEach(block => {
      const activeCollaborator = remoteCursors[block.id] || null;


      console.log('Passing user to block:', block.id, remoteCursors[block.id]);

      if (activeCollaborator) {

        console.log(`✅ [NoteEditor] Block ${block.id} has activeCollaborator:`, {
          id: activeCollaborator.id,
          name: activeCollaborator.name,
          color: activeCollaborator.color
        });


        let blockEl = document.querySelector(`.bn-block-outer[data-id="${block.id}"]`);


        if (!blockEl) {
          blockEl = document.querySelector(`[data-id="${block.id}"]`);
        }


        if (!blockEl) {
          blockEl = document.querySelector(`[data-node-id="${block.id}"]`);
        }


        if (!blockEl) {
          blockEl = document.querySelector(`[data-block-id="${block.id}"]`);
        }

        if (blockEl) {


          blockEl.setAttribute('data-collab-user', activeCollaborator.id);
          blockEl.setAttribute('data-collab-color', activeCollaborator.color);
          blockEl.setAttribute('data-collab-name', activeCollaborator.name || 'Someone');
          (blockEl as HTMLElement).style.setProperty('--collab-color', activeCollaborator.color);

          (blockEl as HTMLElement).style.borderLeft = `3px solid ${activeCollaborator.color}`;
          (blockEl as HTMLElement).style.position = 'relative';
          console.log(`✅ [NoteEditor] DOM styled for block ${block.id}`);
        } else {

          console.log(`❌ [NoteEditor] DOM element NOT found for block ${block.id}`);


          const allOuters = document.querySelectorAll('.bn-block-outer');
          console.log('🔍 [NoteEditor] All .bn-block-outer elements:', allOuters.length);
          allOuters.forEach((el, i) => {
            const dataId = el.getAttribute('data-id');
            console.log(`🔍 [NoteEditor] Block ${i}: data-id="${dataId}"`);
          });

          const allBlocks = document.querySelectorAll('.bn-block');
          console.log('🔍 [NoteEditor] All .bn-block elements:', allBlocks.length);
          if (allBlocks.length > 0) {
            console.log('🔍 [NoteEditor] First .bn-block attributes:',
              Array.from(allBlocks[0].attributes).map(a => `${a.name}="${a.value}"`).join(', ')
            );
          }
        }
      }
    });
  }, [editor, activeUsers, remoteCursors]);


  const openTaskCreation = () => {
    if (!editor) {return;}


    const selection = editor.getTextCursorPosition();
    const block = selection.block;
    let text = "";


    if (block && block.content) {


      text = block.content.map(c => c.text || "").join("");
    }

    if (!text) {
      toast.error("Please put cursor on a line with text");
      return;
    }

    setSelectedTaskText(text);
    setTaskDialogOpen(true);
  };

  const handleCreateTask = async (projectId: string) => {
    try {
      const result = await createQuickTask(projectId, selectedTaskText);
      toast.success("Task created in project!");
      setTaskDialogOpen(false);


    } catch (e) {
      toast.error("Failed to create task");
    }
  };

  const handleInsertTaskLink = async (task: TaskSearchResult) => {
    if (!editor) {return;}

    const markdownLink = `[${task.title} (Task)](/projects/${task.projectId}?task=${task.id})`;

    editor.insertBlocks([
      {
        content: [
          {
            type: "text",
            text: task.title + " ",
            styles: { bold: true }
          },
          {
            type: "link",
            href: `/projects/${task.projectId}?task=${task.id}`,
            content: [{ type: "text", text: "🔗", styles: {} }]
          }
        ]
      }
    ], editor.getTextCursorPosition().block, "after");

    setTaskLinkDialogOpen(false);
  };


  useEffect(() => {
    if (!editor || !note.content) {return;}


    try {
      const currentContent = JSON.stringify(editor.document);
      const newContent = JSON.stringify(note.content);

      if (currentContent !== newContent) {


        if (Array.isArray(note.content)) {
          editor.replaceBlocks(editor.document, note.content);
        }
      }
    } catch (e) {
      console.error("Failed to sync content", e);
    }
  }, [note.content, editor]);

  if (!editor) {
    return <div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Loading editor...</div>;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {}
      {isEditable && (
        <FixedToolbar
          editor={editor}
          onLinkTask={() => setTaskLinkDialogOpen(true)}
        />
      )}

      {/* Paper Container - Google Docs style */}
      <div className="flex-1 overflow-y-auto bg-zinc-950 scrollbar-thin">
        <div className="max-w-4xl mx-auto min-h-screen bg-zinc-900 border-x border-zinc-800 shadow-2xl">
          {}
          <div className="px-16 py-12">

            <EditorHeader
              note={note}
              user={user}
              title={title}
              status={status}
              isEditable={isEditable}
              activeUsers={activeUsers}
              onTitleChange={handleTitleChange}
            />

            {/* Editor Content with cursor awareness */}
            <div
              className="prose prose-invert prose-zinc max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-300 prose-a:text-indigo-400 prose-lg"
              onClick={handleBlockFocus}
              onKeyUp={handleBlockFocus}
            >
              <BlockNoteView
                editor={editor}
                editable={isEditable}
                slashMenu={isEditable}
                onChange={handleContentChange}
                theme="dark"
                className="ZYNC-editor-overrides"
              />
            </div>
          </div>
        </div>
      </div>

      <TaskDialogs
        user={user}
        projects={projects}
        taskDialogOpen={taskDialogOpen}
        setTaskDialogOpen={setTaskDialogOpen}
        taskLinkDialogOpen={taskLinkDialogOpen}
        setTaskLinkDialogOpen={setTaskLinkDialogOpen}
        selectedTaskText={selectedTaskText}
        onCreateTask={(pid) => handleCreateTask(pid)}
        onLinkTask={handleInsertTaskLink}
      />

      <ShareDialog
        noteId={note.id}
        isOpen={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        currentPermissions={note.permissions || {}}
      />
    </div>
  );
};


export default React.memo(NoteEditor, (prev, next) => {


  const isSameNote = prev.note.id === next.note.id;
  const isSameTitle = prev.note.title === next.note.title;
  const isSameUser = prev.user.uid === next.user.uid;

  const isSameContent = prev.note.content === next.note.content;

  return isSameNote && isSameTitle && isSameUser && isSameContent;
});
