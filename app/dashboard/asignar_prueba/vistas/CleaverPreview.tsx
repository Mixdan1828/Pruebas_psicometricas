
import React from 'react';

export default function CleaverPreview({ questions }: { questions: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {questions.map((q) => (
        <div key={q.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1">
            Grupo {q.content_jsonb?.grupo}
          </div>
          <ul className="text-sm text-[#123440] font-medium space-y-1">
            {q.content_jsonb?.palabras?.map((palabra: string, i: number) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9DBA3A]"></div>
                {palabra}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}