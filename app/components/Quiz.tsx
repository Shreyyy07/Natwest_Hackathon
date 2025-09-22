'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, RotateCw, CheckCircle2, XCircle } from 'lucide-react';
import { usePoints } from './points/PointsProvider';
import CoinBurst from './CoinBurst';

const STOP = new Set(['the','a','an','and','or','but','if','then','else','for','while','to','of','in','on','at','by','with','from','as','is','are','was','were','be','been','being','it','this','that','these','those','there','here','i','you','he','she','we','they','them','his','her','our','your','my','mine','ours','yours','their','theirs','me']);

type Question = { id: string; stem: string; options: string[]; correctIndex: number; selectedIndex?: number; };
const POINTS_PER_CORRECT = 10;

function uuid() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2); }
function tokenize(t: string){return (t||'').toLowerCase().replace(/```[\s\S]*?```/g,' ').replace(/`[^`]*`/g,' ').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean);}
function topKeywords(t: string, max=24){const m=new Map<string,number>();for(const w of tokenize(t)){if(STOP.has(w)||w.length<3)continue;m.set(w,(m.get(w)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(([w])=>w).slice(0,max);}
function splitSentences(t:string){return (t||'').replace(/\s+/g,' ').split(/(?<=[.!?])\s+(?=[A-Z0-9])/g).map(s=>s.trim()).filter(Boolean);}
function shuffle<T>(a:T[]){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function escapeRegExp(s:string){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function capitalize(w:string){return w.charAt(0).toUpperCase()+w.slice(1);}

function buildQuestionsFromText(text: string, count=5):Question[]{
  if(!text||text.trim().length<10) return fallbackQuestions();
  const sentences=splitSentences(text); const keywords=topKeywords(text,40); if(keywords.length<4) return fallbackQuestions();
  const qs:Question[]=[]; for(const kw of keywords){ if(qs.length>=count) break; const m=sentences.find(s=>new RegExp(`\\b${escapeRegExp(kw)}\\b`,'i').test(s)); if(!m) continue;
    const stem=m.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`,'i'),'___'); const decoys=shuffle(keywords.filter(k=>k!==kw)).slice(0,3); if(decoys.length<3) continue;
    const optionPool=shuffle([kw,...decoys]); qs.push({id:uuid(), stem: stem.endsWith('.')?stem:`${stem}.`, options: optionPool.map(capitalize), correctIndex: optionPool.findIndex(o=>o===kw) });
  }
  while(qs.length<count){const [kw,...rest]=shuffle(keywords).slice(0,4); if(!kw||rest.length<3) break; const pool=shuffle([kw,...rest]); qs.push({id:uuid(), stem:'Which term best completes the idea: ___ ?', options: pool.map(capitalize), correctIndex: pool.findIndex(o=>o===kw)});}
  return qs.length?qs.slice(0,count):fallbackQuestions();
}
function fallbackQuestions():Question[]{const base=[{stem:'Feedback ___ are essential.',options:['Model','Trained','Produces','Loops'],correctIndex:3},{stem:'Iteration and Improvement: The process is ___.',options:['Algorithms','Improvement','Iterative','Instructions'],correctIndex:2},{stem:'Examples include linear regression, ___ trees, and neural networks.',options:['Algorithms','Decision','Simplified','Examples'],correctIndex:1},{stem:'Data is Key: Machine ___ algorithms learn from data.',options:['Algorithms','Learning','Trained','Unseen'],correctIndex:1},{stem:'A simplified data flow in machine learning: ___',options:['Caption','Output','Decision','Algorithms'],correctIndex:3},];return base.map(q=>({...q,id:uuid()}));}

type Props={ text:string; count?:number; className?:string; };

export default function Quiz({ text, count=5, className='' }: Props) {
  const [questions,setQuestions]=useState<Question[]>([]);
  const [revealed,setRevealed]=useState(false);
  const [burstFromRect,setBurstFromRect]=useState<DOMRect|null>(null);
  const [showBurst,setShowBurst]=useState(false);
  const awardedOnceRef=useRef(false);
  const checkBtnRef=useRef<HTMLButtonElement|null>(null);
  const { addPoints } = usePoints();

  const score = useMemo(()=> revealed ? questions.reduce((a,q)=>a+(q.selectedIndex===q.correctIndex?1:0),0) : 0,[questions,revealed]);

  useEffect(()=>{ setQuestions(buildQuestionsFromText(text,count)); setRevealed(false); awardedOnceRef.current=false; },[text,count]);

  const selectOption=(qid:string,idx:number)=>setQuestions(prev=>prev.map(q=>q.id===qid?{...q,selectedIndex:idx}:q));
  const regenerate=()=>{ setQuestions(buildQuestionsFromText(text,count)); setRevealed(false); awardedOnceRef.current=false; };

  const check=()=>{
    setRevealed(true);
    if(awardedOnceRef.current) return;
    const correct = questions.reduce((a,q)=>a+(q.selectedIndex===q.correctIndex?1:0),0);
    if(correct>0){
      const fromRect = checkBtnRef.current?.getBoundingClientRect() || null;
      setBurstFromRect(fromRect);
      setShowBurst(true);
      addPoints(correct * POINTS_PER_CORRECT);
      awardedOnceRef.current = true;
    }
  };

  return (
    <div className={`quiz-root p-[1px] rounded-2xl bg-gradient-to-r from-violet-700/35 via-fuchsia-600/30 to-blue-600/35 shadow-md ${className}`}>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Sparkles size={16} className="text-violet-400" />
            <span>Quick Quiz</span>
            <span className="text-slate-500 font-normal">• {questions.length} questions</span>
            {revealed && <span className="ml-2 text-slate-400 text-sm">Score: {score}/{questions.length}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={regenerate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-900" title="Regenerate">
              <RotateCw size={14}/> Regenerate
            </button>
            <button ref={checkBtnRef} type="button" onClick={check} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 text-white hover:brightness-110" title="Check answers">
              <CheckCircle2 size={14}/> Check answers
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="p-4 sm:p-5 space-y-4">
          {questions.map((q,qi)=>{
            const isAnswered=typeof q.selectedIndex==='number';
            const isCorrect=revealed&&isAnswered&&q.selectedIndex===q.correctIndex;
            const isWrong=revealed&&isAnswered&&q.selectedIndex!==q.correctIndex;
            return (
              <div key={q.id} className={`rounded-xl border ${isCorrect?'border-emerald-700/60 bg-emerald-900/10':isWrong?'border-rose-800/60 bg-rose-900/10':'border-slate-800 bg-slate-900/40'}`}>
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-slate-300 font-medium">Q{qi+1}. {q.stem}</div>
                  {revealed && (
                    <div className="text-sm">
                      {isCorrect ? <span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 size={14}/> Correct</span>
                                 : isWrong ? <span className="inline-flex items-center gap-1 text-rose-300"><XCircle size={14}/> Incorrect</span>
                                           : null}
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt,oi)=>{
                    const selected=q.selectedIndex===oi;
                    const correct=revealed&&q.correctIndex===oi;
                    const wrong=revealed&&selected&&q.correctIndex!==oi;
                    const base='opt-tile w-full text-left rounded-xl px-3 py-2.5 border transition-all focus:outline-none focus-visible:outline-none';
                    const pal= selected&&!revealed ? 'border-transparent text-white shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600'
                              : correct ? 'border-transparent text-white shadow-md bg-gradient-to-r from-emerald-600 to-teal-600'
                              : wrong   ? 'border-transparent text-white shadow-md bg-gradient-to-r from-rose-600 to-red-600'
                              : 'border-slate-700 text-slate-200 bg-slate-900/60 hover:bg-slate-900';
                    return (
                      <label key={oi} className="inline-block">
                        <input type="radio" name={`q-${q.id}`} className="peer sr-only" checked={selected} onChange={()=>selectOption(q.id,oi)} />
                        <div className={`${base} ${pal}`} aria-pressed={selected}
                          data-state={ selected&&!revealed ? 'selected' : correct ? 'correct' : wrong ? 'wrong' : 'default' }>
                          {opt}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {revealed && (
                  <div className="px-4 pb-4 text-sm text-slate-400">
                    Correct answer: <span className="text-slate-200">{q.options[q.correctIndex]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Coin burst overlay */}
      {showBurst && (
        <CoinBurst
          fromRect={burstFromRect}
          count={Math.min(10, Math.max(4, score))} // more correct => more coins
          onComplete={()=>setShowBurst(false)}
        />
      )}
    </div>
  );
}