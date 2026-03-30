import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, ChevronDown, ChevronLeft, Copy, GripVertical, Edit2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult, DragUpdate } from '@hello-pangea/dnd';

interface QuickChatNode {
  id: string;
  text: string;
  children: QuickChatNode[];
}

const COLOR_THEMES = [
  { rootBg: 'bg-blue-100', rootBorder: 'border-blue-400', childBorder: 'border-blue-200', hoverBorder: 'hover:border-blue-400', line: 'border-blue-200', text: 'text-blue-900' },
  { rootBg: 'bg-green-100', rootBorder: 'border-green-400', childBorder: 'border-green-200', hoverBorder: 'hover:border-green-400', line: 'border-green-200', text: 'text-green-900' },
  { rootBg: 'bg-orange-100', rootBorder: 'border-orange-400', childBorder: 'border-orange-200', hoverBorder: 'hover:border-orange-400', line: 'border-orange-200', text: 'text-orange-900' },
  { rootBg: 'bg-pink-100', rootBorder: 'border-pink-400', childBorder: 'border-pink-200', hoverBorder: 'hover:border-pink-400', line: 'border-pink-200', text: 'text-pink-900' },
  { rootBg: 'bg-teal-100', rootBorder: 'border-teal-400', childBorder: 'border-teal-200', hoverBorder: 'hover:border-teal-400', line: 'border-teal-200', text: 'text-teal-900' },
  { rootBg: 'bg-purple-100', rootBorder: 'border-purple-400', childBorder: 'border-purple-200', hoverBorder: 'hover:border-purple-400', line: 'border-purple-200', text: 'text-purple-900' },
];

export const QuickChatManager = ({ config, refreshConfig, showAlert }: { config: any, refreshConfig: () => void, showAlert: (msg: string, title?: string) => void }) => {
  const [tree, setTree] = useState<QuickChatNode[]>(config.quickChat || []);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveTree = async (newTree: QuickChatNode[]) => {
    const newConfig = { ...config, quickChat: newTree };
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      refreshConfig();
      setTree(newTree);
    } catch (error) {
      showAlert('حدث خطأ أثناء حفظ الإعدادات', 'خطأ');
    }
  };

  const addNode = (parentId: string | null, text: string) => {
    const newNode: QuickChatNode = { id: Date.now().toString() + Math.random().toString(36).substring(2, 9), text, children: [] };
    const updateTree = (nodes: QuickChatNode[]): QuickChatNode[] => {
      if (parentId === null) return [...nodes, newNode];
      return nodes.map(node => {
        if (node.id === parentId) return { ...node, children: [...node.children, newNode] };
        return { ...node, children: updateTree(node.children) };
      });
    };
    saveTree(updateTree(tree));
  };

  const deleteNode = (id: string) => {
    const updateTree = (nodes: QuickChatNode[]): QuickChatNode[] => {
      return nodes.filter(node => node.id !== id).map(node => ({ ...node, children: updateTree(node.children) }));
    };
    saveTree(updateTree(tree));
  };

  const editNode = (id: string, newText: string) => {
    const updateTree = (nodes: QuickChatNode[]): QuickChatNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, text: newText };
        }
        return { ...node, children: updateTree(node.children) };
      });
    };
    saveTree(updateTree(tree));
  };

  const copyNode = (nodeToCopy: QuickChatNode) => {
    const deepCopy = (node: QuickChatNode): QuickChatNode => ({
      ...node,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      children: node.children.map(deepCopy)
    });

    const copiedNode = deepCopy(nodeToCopy);

    const findParentId = (nodes: QuickChatNode[], targetId: string, currentParentId: string | null = null): string | null | undefined => {
      for (const node of nodes) {
        if (node.id === targetId) return currentParentId;
        const found = findParentId(node.children, targetId, node.id);
        if (found !== undefined) return found;
      }
      return undefined;
    };

    const parentId = findParentId(tree, nodeToCopy.id);

    const updateTree = (nodes: QuickChatNode[]): QuickChatNode[] => {
      if (parentId === null) {
        const index = nodes.findIndex(n => n.id === nodeToCopy.id);
        if (index !== -1) {
          const newNodes = [...nodes];
          newNodes.splice(index + 1, 0, copiedNode);
          return newNodes;
        }
        return [...nodes, copiedNode];
      }
      return nodes.map(node => {
        if (node.id === parentId) {
          const index = node.children.findIndex(n => n.id === nodeToCopy.id);
          if (index !== -1) {
            const newChildren = [...node.children];
            newChildren.splice(index + 1, 0, copiedNode);
            return { ...node, children: newChildren };
          }
          return { ...node, children: [...node.children, copiedNode] };
        }
        return { ...node, children: updateTree(node.children) };
      });
    };
    saveTree(updateTree(tree));
  };

  const onDragUpdate = (update: DragUpdate) => {
    if (update.combine) {
      const targetId = update.combine.draggableId;
      setExpandedNodes(prev => {
        if (!prev.has(targetId)) {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        }
        return prev;
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination && !result.combine) return;
    const { source, destination, combine, draggableId } = result;

    if (destination && source.droppableId === destination.droppableId && source.index === destination.index) return;

    const findNode = (nodes: QuickChatNode[], id: string): QuickChatNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
      }
      return null;
    };

    const isDescendant = (node: QuickChatNode, targetId: string): boolean => {
      if (node.id === targetId) return true;
      return node.children.some(child => isDescendant(child, targetId));
    };

    const targetId = combine ? combine.draggableId : destination?.droppableId;

    if (targetId && targetId !== 'root') {
      const nodeBeingDragged = findNode(tree, draggableId);
      if (nodeBeingDragged && isDescendant(nodeBeingDragged, targetId)) {
        showAlert('لا يمكن نقل العنصر إلى داخل نفسه أو أحد تفرعاته', 'خطأ');
        return;
      }
    }

    let draggedNode: QuickChatNode | null = null;

    const removeFromTree = (nodes: QuickChatNode[], parentId: string): QuickChatNode[] => {
      if (parentId === 'root') {
        const newNodes = [...nodes];
        draggedNode = newNodes.splice(source.index, 1)[0];
        return newNodes;
      }
      return nodes.map(node => {
        if (node.id === parentId) {
          const newChildren = [...node.children];
          draggedNode = newChildren.splice(source.index, 1)[0];
          return { ...node, children: newChildren };
        }
        return { ...node, children: removeFromTree(node.children, parentId) };
      });
    };

    let newTree = removeFromTree(tree, source.droppableId);

    if (!draggedNode) return;

    const insertIntoTree = (nodes: QuickChatNode[], parentId: string): QuickChatNode[] => {
      if (parentId === 'root') {
        const newNodes = [...nodes];
        if (destination) {
          newNodes.splice(destination.index, 0, draggedNode!);
        } else {
          newNodes.unshift(draggedNode!);
        }
        return newNodes;
      }
      return nodes.map(node => {
        if (node.id === parentId) {
          const newChildren = [...node.children];
          if (destination) {
            newChildren.splice(destination.index, 0, draggedNode!);
          } else {
            newChildren.unshift(draggedNode!);
          }
          return { ...node, children: newChildren };
        }
        return { ...node, children: insertIntoTree(node.children, parentId) };
      });
    };

    newTree = insertIntoTree(newTree, targetId || 'root');
    saveTree(newTree);
    
    if (combine) {
      setExpandedNodes(prev => new Set(prev).add(targetId!));
    }
  };

  const renderNode = (node: QuickChatNode, index: number, depth: number = 0, colorIndex: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const theme = COLOR_THEMES[colorIndex % COLOR_THEMES.length];

    return (
      // @ts-ignore
      <Draggable key={node.id} draggableId={node.id} index={index}>
        {(provided, snapshot) => {
          const content = (
            <div 
              ref={provided.innerRef}
              {...provided.draggableProps}
              style={{
                ...provided.draggableProps.style,
                ...(snapshot.isDragging ? { zIndex: 9999 } : {})
              }}
              className={`flex flex-col ${snapshot.isDragging ? 'opacity-90 shadow-2xl bg-gray-50 rounded-xl' : ''}`}
            >
              <div className={`flex items-center gap-3 py-2 px-4 border-2 rounded-xl shadow-sm transition-all mb-3 ${theme.rootBg} ${theme.rootBorder} ${theme.hoverBorder}`}>
                <div {...provided.dragHandleProps} className="cursor-grab hover:bg-black/5 p-1 rounded-md">
                  <GripVertical className={`w-5 h-5 ${theme.text} opacity-50`} />
                </div>
                
                {hasChildren ? (
                  <button onClick={() => toggleExpand(node.id)} className={`p-1 rounded-md transition-colors ${theme.text} hover:bg-black/5`}>
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>
                ) : (
                  <div className="w-7" /> // spacer for alignment
                )}
                
                <span className={`font-bold flex-1 ${theme.text} ${depth === 0 ? 'text-lg' : 'text-base'}`}>
                  {node.text}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const newText = prompt('تعديل النص:', node.text);
                      if (newText && newText.trim() !== '') {
                        editNode(node.id, newText.trim());
                      }
                    }} 
                    className="p-1 text-orange-600 rounded-lg transition-colors flex items-center gap-1"
                    title="تعديل"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => copyNode(node)} 
                    className="p-1 text-blue-600 rounded-lg transition-colors flex items-center gap-1"
                    title="نسخ"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => { 
                      const text = prompt('أدخل السؤال/النص الجديد:'); 
                      if (text) {
                        addNode(node.id, text);
                        setExpandedNodes(prev => new Set(prev).add(node.id)); // Auto-expand when adding
                      }
                    }} 
                    className="p-1 text-green-700 rounded-lg transition-colors flex items-center gap-1"
                    title="إضافة تفرع جديد"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا العنصر وكل ما يتفرع منه؟')) {
                        deleteNode(node.id);
                      }
                    }} 
                    className="p-1 text-red-500 rounded-lg transition-colors flex items-center gap-1"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {isExpanded && (
                <Droppable droppableId={node.id} type="list" isCombineEnabled>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col pr-6 sm:pr-8 border-r-4 ${theme.line} mr-4 sm:mr-6 w-full mt-1 min-h-[10px]`}
                    >
                      {node.children.map((child, idx) => {
                        const childColorIndex = child.children.length > 0 ? (colorIndex + idx + 1) : colorIndex;
                        return renderNode(child, idx, depth + 1, childColorIndex);
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          );

          return snapshot.isDragging ? ReactDOM.createPortal(content, document.body) : content;
        }}
      </Draggable>
    );
  };

  return (
    <div className="box-game p-6 sm:p-8 shadow-sm w-full h-full overflow-auto bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-200 pb-6 gap-4">
        <div>
          <h3 className="text-2xl sm:text-3xl font-black text-main mb-2">إدارة Quick Chat</h3>
          <p className="text-gray-500 text-sm font-bold">أضف الأسئلة والتفرعات التي ستظهر للاعبين أثناء اللعب</p>
        </div>
        <button 
          onClick={() => { 
            const text = prompt('أدخل اسم القسم الرئيسي الجديد (مثال: حيوانات، جماد...):'); 
            if (text) addNode(null, text); 
          }} 
          className="btn-game btn-primary text-sm px-6 py-3 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          إضافة قسم رئيسي
        </button>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
        <Droppable droppableId="root" type="list" isCombineEnabled>
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-col w-full max-w-2xl mx-auto pb-20 min-h-[100px]"
            >
              {tree.length === 0 ? (
                <div className="text-center text-gray-500 py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                  <p className="font-bold text-lg mb-2">لا توجد أقسام حالياً</p>
                  <p className="text-sm">ابدأ بإضافة قسم رئيسي لتكوين شجرة الأسئلة</p>
                </div>
              ) : (
                tree.map((node, index) => renderNode(node, index, 0, index))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

