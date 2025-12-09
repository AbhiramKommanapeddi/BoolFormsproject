import React from 'react';
import { Type, PenTool, Image as ImageIcon, Calendar, CheckSquare } from 'lucide-react';

const TOOLS = [
    { id: 'text', label: 'Text Field', icon: Type },
    { id: 'signature', label: 'Signature', icon: PenTool },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
];

const Sidebar = () => {
    const handleDragStart = (e, type) => {
        // Standard HTML5 Drag & Drop
        e.dataTransfer.setData('application/type', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg z-20">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-700">Toolbox</h2>
                <p className="text-xs text-gray-400 mt-1">Drag fields onto the document</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {TOOLS.map((tool) => (
                    <div
                        key={tool.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, tool.id)}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm active:cursor-grabbing"
                    >
                        <tool.icon size={18} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
