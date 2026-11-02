import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

interface Props {
  moduleName: string;
  description: string;
  phase: string;
}

export const PlaceholderModule: React.FC<Props> = ({ moduleName, description, phase }) => {
  return (
    <div className="valexis-card rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
      <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
        <Sparkles className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
        Ready for Next Phase: {phase}
      </span>
      <h2 className="text-xl font-bold text-white mt-3 mb-1">{moduleName}</h2>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">{description}</p>
      <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
        <p className="text-xs font-mono text-slate-300">
          Database entities & API contracts for this module are established in ValexisDb.
        </p>
      </div>
    </div>
  );
};
