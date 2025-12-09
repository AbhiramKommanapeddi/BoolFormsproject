import React, { useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Rnd } from 'react-rnd';

const PDFCanvas = ({ file, fields, onAddField, onUpdateField }) => {
    const [numPages, setNumPages] = useState(null);
    const pdfWrapperRef = useRef(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/type');
        if (!type) return;

        const wrapper = pdfWrapperRef.current;
        if (!wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        onAddField(type, x, y, rect.width, rect.height);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Document Wrapper */}
            <div
                className="relative shadow-2xl"
                ref={pdfWrapperRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="flex flex-col gap-4"
                >
                    {/* We only render Page 1 for Prototype stability */}
                    <Page
                        pageNumber={1}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="border border-gray-200"
                        width={600}
                    />
                </Document>

                {/* Overlay Layer for Fields */}
                {fields.map((field) => (
                    <Rnd
                        key={field.id}
                        size={{ width: `${field.width}%`, height: `${field.height}%` }}
                        position={{
                            x: (field.x / 100) * (pdfWrapperRef.current?.offsetWidth || 0),
                            y: (field.y / 100) * (pdfWrapperRef.current?.offsetHeight || 0),
                        }}
                        bounds="parent"
                        onDragStop={(e, d) => {
                            const w = pdfWrapperRef.current?.offsetWidth || 1;
                            const h = pdfWrapperRef.current?.offsetHeight || 1;
                            onUpdateField(field.id, { x: (d.x / w) * 100, y: (d.y / h) * 100 });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            const w = pdfWrapperRef.current?.offsetWidth || 1;
                            const h = pdfWrapperRef.current?.offsetHeight || 1;
                            onUpdateField(field.id, {
                                width: (parseInt(ref.style.width) / w) * 100,
                                height: (parseInt(ref.style.height) / h) * 100,
                                ...position
                                    ? { x: (position.x / w) * 100, y: (position.y / h) * 100 }
                                    : {}
                            });
                        }}
                        className="border-2 border-blue-500 bg-blue-50/50 flex items-center justify-center group"
                    >
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center text-sm font-semibold text-blue-800 select-none">
                            {field.type === 'signature' && 'Signature'}
                            {field.type === 'text' && 'Text'}
                            {field.type === 'image' && 'Image'}
                            {field.type === 'date' && 'Date'}
                            {field.type === 'checkbox' && '☑'}

                            <button
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); /* removeField(field.id) */ }}
                            >
                                ×
                            </button>
                        </div>
                    </Rnd>
                ))}
            </div>

            <div className="text-gray-500 text-sm mt-4">
                Page 1 of {numPages || '--'}
            </div>
        </div>
    );
};

export default PDFCanvas;
