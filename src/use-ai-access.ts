import { useState } from 'react'
const KEY = 'pain-tracker-ai-access-token'
function readToken(){try{return window.localStorage.getItem(KEY)||''}catch{return ''}}
export function useAiAccess(){
  const [initial] = useState(readToken)
  const [token,setToken] = useState(initial)
  const [remember,setRemember] = useState(Boolean(initial))
  const [storageError,setStorageError] = useState('')
  function changeToken(value:string){
    setToken(value)
    if(remember){try{if(value)window.localStorage.setItem(KEY,value);else window.localStorage.removeItem(KEY);setStorageError('')}catch{setStorageError('Změnu uloženého přístupu se nepodařilo uložit. Použij Zapomenout přístup; při opakované chybě vymaž data webu.')}}
  }
  function changeRemember(enabled:boolean){
    try{if(enabled&&token)window.localStorage.setItem(KEY,token);else window.localStorage.removeItem(KEY);setRemember(enabled);setStorageError('')}catch{setStorageError('Nastavení zapamatování se nepodařilo změnit. Uložený token mohl zůstat v prohlížeči; při opakované chybě vymaž data webu.')}
  }
  function forget(){
    setToken('');setRemember(false)
    try{window.localStorage.removeItem(KEY);setStorageError('')}catch{setStorageError('Přístup byl odstraněn z paměti, ale ne z úložiště. Pro úplné odstranění vymaž data tohoto webu v prohlížeči.')}
  }
  return {token,remember,storageError,changeToken,changeRemember,forget}
}
