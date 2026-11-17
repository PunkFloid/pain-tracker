export function medicationsForPain(pain,medications,now=Date.now()){
  const start=Date.parse(pain.start),end=pain.end===null?now:Date.parse(pain.end)
  return medications.filter(m=>{
    const at=Date.parse(m.at)
    if(!Number.isFinite(at)||at>now||!(m.count>0))return false
    return m.painId===pain.id||(!m.painId&&at>=start&&at<=end)
  }).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))
}
export function painMedicationStatus(pain,medications,now=Date.now()){
  if(medicationsForPain(pain,medications,now).length)return 'treated'
  return pain.end===null?'pending':'untreated'
}
