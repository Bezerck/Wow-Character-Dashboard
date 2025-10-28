"use client";
import React from "react";

export interface CharacterTabMeta {
  id: string;
  name: string; // Display name from character JSON
  json: string; // Raw character JSON
}

interface CharacterTabsProps {
  characters: CharacterTabMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const CharacterTabsClean: React.FC<CharacterTabsProps> = ({
  characters,
  activeId,
  onSelect,
  onAdd,
  onDelete,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-gray-900/70 p-1 rounded-md border border-gray-700">
      {characters.map((c) => {
        const isActive = c.id === activeId;
        return (
          <div
            key={c.id}
            className={`group flex items-center max-w-[200px] ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } rounded px-2 py-1 text-xs cursor-pointer relative`}
            onClick={() => onSelect(c.id)}
            title={c.name}
          >
            <span className="truncate flex-1">{c.name || "Unnamed"}</span>
            {characters.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-70 hover:opacity-100 transition text-[10px]"
                title="Delete character"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white rounded px-2 py-1 text-xs font-medium"
        title="Add new character"
      >
        + Add Character
      </button>
    </div>
  );
};

export default CharacterTabsClean;
