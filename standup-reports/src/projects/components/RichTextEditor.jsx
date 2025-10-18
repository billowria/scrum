import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiChevronDown,
  FiCode,
  FiLink,
  FiImage,
  FiX,
  FiEye,
  FiEdit3
} from 'react-icons/fi';

const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  showToolbar = true,
  className = '',
  minHeight = '150px',
  maxHeight = '500px',
  autoSave = false,
  onAutoSave
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable: editable && !isPreviewMode,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);

      if (autoSave && onAutoSave) {
        onAutoSave(html);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 min-h-[${minHeight}] ${className}`,
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto;`
      }
    }
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();

  // Alignment functions removed - TextAlign extension not available

  const addLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const removeLink = () => {
    editor?.chain().focus().unsetLink().run();
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const isActive = (name) => {
    return editor?.isActive(name) || false;
  };

  const isLinkActive = () => {
    return editor?.isActive('link') || false;
  };

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      {showToolbar && editable && (
        <div className="border-b border-gray-200 bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Bold"
            >
              <FiBold className="w-4 h-4" />
            </button>
            <button
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Italic"
            >
              <FiItalic className="w-4 h-4" />
            </button>
            <button
              onClick={toggleUnderline}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('underline') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Underline"
            >
              <FiUnderline className="w-4 h-4" />
            </button>
          </div>

          {/* Text Alignment removed - TextAlign extension not available */}

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={toggleBulletList}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Bullet List"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={toggleOrderedList}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Numbered List"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Code */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            <button
              onClick={toggleCodeBlock}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'text-gray-700'
              }`}
              title="Code Block"
            >
              <FiCode className="w-4 h-4" />
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
            {isLinkActive() ? (
              <button
                onClick={removeLink}
                className="p-2 rounded hover:bg-gray-200 transition-colors text-blue-600"
                title="Remove Link"
              >
                <FiX className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowLinkDialog(!showLinkDialog)}
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
                title="Add Link"
              >
                <FiLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Image */}
          <div className="flex items-center gap-1">
            <button
              onClick={insertImage}
              className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
              title="Insert Image"
            >
              <FiImage className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                isPreviewMode ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
              }`}
              title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            >
              {isPreviewMode ? <FiEdit3 className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={addLink}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowLinkDialog(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div
        className={`border border-t-0 border-gray-200 rounded-b-lg overflow-hidden ${
          !editable || isPreviewMode ? 'rounded-t-lg' : ''
        }`}
        style={{ minHeight, maxHeight }}
      >
        <EditorContent
          editor={editor}
          className={`prose prose-sm max-w-none focus:outline-none ${
            isPreviewMode ? 'pointer-events-none' : ''
          }`}
        />
      </div>

      {/* Character Count */}
      {editable && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
          {editor?.storage.characterCount?.characters() || 0} characters
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;