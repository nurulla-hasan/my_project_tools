// /* eslint-disable @typescript-eslint/no-explicit-any */
import "./tiptap-editor.css";

import { useEditor, EditorContent } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

// Custom Video Extension
const Video = Node.create({
  name: "video",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "video",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: true,
        class: "rounded-lg border border-border my-4",
      }),
    ];
  },
});

// Custom Audio Extension
const Audio = Node.create({
  name: "audio",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "audio",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(HTMLAttributes, {
        class: "w-full my-4",
      }),
    ];
  },
});

// Custom File Attachment Extension
const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      fileName: {
        default: "Download File",
      },
      fileSize: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="file-attachment"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        "data-type": "file-attachment",
        class:
          "flex items-center gap-3 p-4 border border-border rounded-lg no-underline my-4 hover:bg-muted transition-colors",
        target: "_blank",
      }),
      [
        "span",
        { class: "p-2 bg-primary/10 rounded-md text-primary" },
        "📄", // Fallback icon
      ],
      [
        "div",
        { class: "flex flex-col gap-1" },
        ["span", { class: "font-medium text-foreground" }, HTMLAttributes.fileName],
        ["span", { class: "text-xs text-muted-foreground" }, HTMLAttributes.fileSize],
      ],
    ];
  },
});

// Custom Youtube Extension
const Youtube = Node.create({
  name: "youtube",
  group: "block",
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe[src*='youtube.com'], iframe[src*='youtu.be']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "youtube-container my-4" },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          allowfullscreen: "true",
          frameborder: "0",
          class: "rounded-lg shadow-md",
        }),
      ],
    ];
  },
});

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  // Upload,
  Code as CodeIcon,
  Table as TableIcon,
  Plus,
  Trash,
  Columns,
  Rows,
  Spline,
  // Youtube as YoutubeIcon,
  // Music,
} from "lucide-react";
import { useRef, useEffect } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TiptapEditor = ({ value, onChange, placeholder }: TiptapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const [isUploading, setIsUploading] = useState(false);

  // REST API upload function (Backend Dev provided API)
  // const uploadFile = async (file: File): Promise<string> => {
  //   setIsUploading(true);
    
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", file); // Key might be 'image' or 'file' depending on backend
      
  //     // Replace with your actual backend API endpoint
  //     const API_URL = import.meta.env.VITE_API_UPLOAD_URL || "http://your-backend-api.com/upload";
      
  //     const response = await fetch(API_URL, {
  //       method: "POST",
  //       body: formData,
  //       // If your API requires authentication, add headers here:
  //       // headers: {
  //       //   'Authorization': `Bearer ${token}`
  //       // }
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Upload failed");
  //     }

  //     const data = await response.json();
  //     setIsUploading(false);
      
  //     // Adjust this based on your API response structure (e.g., data.url or data.data.url)
  //     return data.url || data.secure_url || data.data?.url;
  //   } catch (error: any) {
  //     setIsUploading(false);
  //     console.error("Upload error:", error);
  //     throw error;
  //   }
  // };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-500 underline",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image,
      Video,
      Audio,
      Youtube,
      FileAttachment,
      Placeholder.configure({
        placeholder: placeholder || "Type here…",
        includeChildren: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      FontFamily,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "max-w-none outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // const addAudioLink = () => {
  //   const url = window.prompt("Enter Audio URL");
  //   if (url) {
  //     editor.chain().focus().insertContent(`<audio src="${url}" controls></audio>`).run();
  //   }
  // };

  // const addYoutubeLink = () => {
  //   const url = window.prompt("Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
  //   if (url) {
  //     // Basic conversion of watch?v= to embed/
  //     let embedUrl = url;
  //     if (url.includes("watch?v=")) {
  //       embedUrl = url.replace("watch?v=", "embed/");
  //     } else if (url.includes("youtu.be/")) {
  //       embedUrl = url.replace("youtu.be/", "youtube.com/embed/");
  //     }
  //     editor.chain().focus().insertContent({
  //       type: "youtube",
  //       attrs: { src: embedUrl }
  //     }).run();
  //   }
  // };

  // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   try {
  //     const url = await uploadFile(file);
  //     const fileSize = (file.size / 1024).toFixed(1) + " KB";

  //     if (file.type.startsWith("image/")) {
  //       editor.chain().focus().setImage({ src: url }).run();
  //     } else if (file.type.startsWith("video/")) {
  //       editor.chain().focus().insertContent(`<video src="${url}" controls></video>`).run();
  //     } else if (file.type.startsWith("audio/")) {
  //       editor.chain().focus().insertContent(`<audio src="${url}" controls></audio>`).run();
  //     } else {
  //       // For PDF, ZIP, etc.
  //       editor
  //         .chain()
  //         .focus()
  //         .insertContent({
  //           type: "fileAttachment",
  //           attrs: {
  //             href: url,
  //             fileName: file.name,
  //             fileSize: fileSize,
  //           },
  //         })
  //         .run();
  //     }
  //   } catch (error) {
  //     console.error("Upload failed:", error);
  //     alert("Failed to upload file. Please try again.");
  //   }

  //   // Reset input
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  // };

  // const triggerFileUpload = () => {
  //   fileInputRef.current?.click();
  // };

  return (
    <div className="flex flex-col gap-2 w-full">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        // onChange={handleFileUpload}
      />
      <TooltipProvider>
        {/* --- TOOLBAR --- */}
        <div className="border border-input bg-transparent rounded-md p-1 flex flex-wrap gap-1 items-center">
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1 h-6" />

          {/* Bold */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bold")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBold().run()
                }
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          {/* Italic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("italic")}
                onPressedChange={() =>
                  editor.chain().focus().toggleItalic().run()
                }
              >
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          {/* Underline */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("underline")}
                onPressedChange={() =>
                  editor.chain().focus().toggleUnderline().run()
                }
              >
                <UnderlineIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>

          {/* Strikethrough */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("strike")}
                onPressedChange={() =>
                  editor.chain().focus().toggleStrike().run()
                }
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1 h-6" />

          {/* Align Left */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "left" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
              >
                <AlignLeft className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>

          {/* Align Center */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "center" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
              >
                <AlignCenter className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>

          {/* Align Right */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "right" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
              >
                <AlignRight className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>

          {/* Justify */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: "justify" })}
                onPressedChange={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
              >
                <AlignJustify className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1 h-6" />

          {/* Heading 1 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 1 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <Heading1 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          {/* Heading 2 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                <Heading2 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          {/* Heading 3 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("heading", { level: 3 })}
                onPressedChange={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                <Heading3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>

          <div className="w-px bg-border mx-1 h-6" />

          {/* Bullet List */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBulletList().run()
                }
              >
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          {/* Ordered List */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() =>
                  editor.chain().focus().toggleOrderedList().run()
                }
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>

          {/* Blockquote */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("blockquote")}
                onPressedChange={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
              >
                <Quote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Blockquote</TooltipContent>
          </Tooltip>

          {/* Code */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive("code")}
                onPressedChange={() =>
                  editor.chain().focus().toggleCode().run()
                }
              >
                <CodeIcon className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Inline Code</TooltipContent>
          </Tooltip>

          {/* Links & Media */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={editor.isActive("link")}
                  onPressedChange={setLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Text Link</TooltipContent>
            </Tooltip>
            
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="grid gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={addAudioLink}
                  >
                    <Music className="h-4 w-4" />
                    Audio Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={addYoutubeLink}
                  >
                    <YoutubeIcon className="h-4 w-4" />
                    YouTube Embed
                  </Button>
                  <div className="h-px bg-border my-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9"
                    onClick={triggerFileUpload}
                    disabled={isUploading}
                  >
                    <Upload className={`h-4 w-4 ${isUploading ? "animate-bounce" : ""}`} />
                    {isUploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover> */}
          </div>

          {/* Table */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Toggle size="sm" pressed={editor.isActive("table")}>
                    <TableIcon className="h-4 w-4" />
                  </Toggle>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Table Options</TooltipContent>
            </Tooltip>

            <PopoverContent className="w-56 p-2" align="start">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1">
                  Table Controls
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Insert Table (3x3)
                </Button>
                {editor.isActive("table") && (
                  <>
                    <div className="h-px bg-border my-1" />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() =>
                        editor.chain().focus().addColumnAfter().run()
                      }
                    >
                      <Columns className="mr-2 h-4 w-4" /> Add Column
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() =>
                        editor.chain().focus().deleteColumn().run()
                      }
                    >
                      <Trash className="mr-2 h-4 w-4 text-red-500" /> Delete
                      Column
                    </Button>

                    <div className="h-px bg-border my-1" />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => editor.chain().focus().addRowAfter().run()}
                    >
                      <Rows className="mr-2 h-4 w-4" /> Add Row
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => editor.chain().focus().deleteRow().run()}
                    >
                      <Trash className="mr-2 h-4 w-4 text-red-500" /> Delete Row
                    </Button>

                    <div className="h-px bg-border my-1" />

                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8"
                      onClick={() => editor.chain().focus().mergeCells().run()}
                    >
                      <Spline className="mr-2 h-4 w-4" /> Merge Cells
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => editor.chain().focus().deleteTable().run()}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete Table
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Font Family */}
          <Select
            value={editor.getAttributes("textStyle").fontFamily || "Inter"}
            onValueChange={(value) => {
              if (value === "Inter") {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(value).run();
              }
            }}
          >
            <SelectTrigger className="w-fit" size="sm">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter" style={{ fontFamily: "Inter" }}>
                Inter
              </SelectItem>
              <SelectItem
                value="Comic Sans MS, Comic Sans"
                style={{ fontFamily: "Comic Sans MS" }}
              >
                Comic Sans
              </SelectItem>
              <SelectItem value="serif" style={{ fontFamily: "serif" }}>
                Serif
              </SelectItem>
              <SelectItem value="monospace" style={{ fontFamily: "monospace" }}>
                Monospace
              </SelectItem>
              <SelectItem value="cursive" style={{ fontFamily: "cursive" }}>
                Cursive
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TooltipProvider>

      {/* --- EDITOR CONTENT --- */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
