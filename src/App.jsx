import { useState , useEffect,useRef} from 'react'
import './App.css'
import { useAutoAnimate } from '@formkit/auto-animate/react'


function App(){
  // const API_URL='http://localhost:3000/api/todos'
  const API_URL='https://todo-backend-49nv.onrender.com'
  const [text,settext]=useState('')
  const [message,setmessage]=useState([])
  const [editingtodo,seteditingtodo]=useState(null)
  const notifiedid=useRef(new Set())
  const [animationParent] = useAutoAnimate()
  

  const formatTime = (timeString) => {
  if (!timeString) return '';
  const d = new Date(timeString);
  
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  };



  const textinput=(e)=>{
    settext(e.target.value)
  }


  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission()
      }
    }
  }, []);




  useEffect(()=>{
    const timer=setInterval(() => {
      const now = new Date();
      const localNowString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      message.forEach((item)=>{
        if (item.remindertime){
        console.log(localNowString,item.remindertime)}
        if (item.remindertime==localNowString &&!item.checked&&!notifiedid.current.has(item._id)){
          if ('Notification' in window && Notification.permission === 'granted'&&false) {
            console.log("🎯 條件達成！準備發射通知！")
            new Notification('待辦事項提醒', {
              body: `該去做【${item.content}】囉！`,
              icon: '/vite.svg' 
            })
          } else {
            console.log("🎯 條件達成！準備發射通知！")
            alert(`⏰ 提醒您：該去【${item.content}】囉！`)
          }
        notifiedid.current.add(item._id)

        }
      })
    }, 1000)
    return ()=>{clearInterval(timer)}
  },[message])

  useEffect(()=>{
    const fetchtodo=async()=>{
      try{
      const response=await fetch(API_URL)
      const data=await response.json()
      setmessage(data)
      console.log(data)
      }catch (error){
      console.error('抓取資料失敗',error)
      }}
    fetchtodo()    
    }
    ,[])

  const escpressed=(e)=>{
    if (e.key=='Escape'){
      savedetail(editingtodo)
      seteditingtodo(null)
    }
      
  }


  const sendclicked=async()=>{
    if (text==''){
      return
    }
    try{
      const response=await fetch(API_URL,{method:'POST',
        headers:{'Content-Type': 'application/json'},
        body:JSON.stringify({content:text})
      })
      const newtodo=await response.json()
      setmessage([...message,newtodo])
      settext('')
    }catch (error){
      console.error("新增失敗:", error)
    }
    

  }
  const enterpressed=(e)=>{
    if (e.key=='Enter')
      sendclicked()
  }

  const deletepressed= async(id)=>{
    try{
      await fetch(`${API_URL}/${id}`,{method:'DELETE'})
      const newmessage=(
    message.filter((item)=>item._id!=id))
    setmessage(newmessage)
  }catch(error){
    console.error('刪除失敗',error)
  }
  }


  const savedetail= async (item)=>{
    try{
      await fetch(`${API_URL}/${item._id}`,{method:'PUT',
        headers:{'Content-Type': 'application/json'}
      ,body:JSON.stringify(item)
    })
    const newmessage=message.map((i)=>{
      if (i._id==item._id){
        return {...i,...item}
      }else{
        return i
      }
    })
    notifiedid.current.delete(item._id);
    setmessage(newmessage)
    console.log(newmessage)
    }catch(error){
      console.error('detail upload failed',error)
    }
  }



  const checkchanged=async(id)=>{
    const targetitem=message.find((item)=>item._id===id)
    const newcheckedstatus=!targetitem.checked
    try{
      await fetch(`${API_URL}/${id}`,{method:'PUT',
        headers:{'Content-Type': 'application/json'},
        body:JSON.stringify({checked:newcheckedstatus})
      }
      )
      const newmessage=(
      message.map((item)=>{
        if (item._id==id){
          return {...item,checked:!item.checked}
        }else{
          return item
        }
      })
    )
      setmessage(newmessage)
    }catch (error){
      console.error('更新狀態失敗',error)
    }

    
  }


  return(
  <div className='container'>
    <h1>To do list</h1>
    <div className='inputgroup'>
      <input type="text" value={text} onChange={textinput} onKeyDown={enterpressed}/>
      <button onClick={sendclicked}>send</button>
    </div>



    <div className='todogroup' ref={animationParent}>
      {message.map((item)=>{
        return(<div className='todorow'key={item._id} onClick={()=>seteditingtodo(item)} >
        <input type="checkbox" checked={item.checked} onChange={()=>checkchanged(item._id)} onClick={(e)=>e.stopPropagation()} placeholder='enter to do'/>
        <div className='todo-info'>
          <h1  className={`todo ${item.checked?'checked':'unchecked'} todo-text`} onClick={
            (e)=>{e.stopPropagation()
            seteditingtodo(item)}}>{item.content}</h1>
          <span className='timetag'>{item.remindertime?formatTime(item.remindertime):'未設定'}</span>
        </div>
        <button className='deletebutton' onClick={(e)=>{e.stopPropagation()
          deletepressed(item._id)} }>delete</button>
        </div>)
      })}
    </div>



    {editingtodo&&
    <div className='popup-overlay' onKeyDown={escpressed} tabIndex="0">
      <div className='popup-content'>
      <h2>編輯事項</h2>
      <textarea  autoFocus name="" id="" onChange={(e)=>{seteditingtodo({...editingtodo,detailcontent:e.target.value})}} value={editingtodo.detailcontent||''}></textarea>
      <input type='datetime-local' onChange={(e)=>{seteditingtodo({...editingtodo,remindertime:e.target.value})}} value={editingtodo.remindertime||''}/>
      <button className='closedetailbutton' onClick={()=>{
        savedetail(editingtodo)
        seteditingtodo(null)}
        }>save and close</button>
      </div>

    </div>}
    
    

  </div>)
}

export default App