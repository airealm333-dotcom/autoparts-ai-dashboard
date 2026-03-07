import { useState, useRef } from "react";
import axios from "axios";

export default function UploadPanel({ onDataLoaded, apiBase }) {
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState(null);
  const inputRef = useRef();

  const downloadSample = async () => {
    try {
      const { data } = await axios.get(`${apiBase}/api/sample-csv`);
      const blob = new Blob([data.csv],{type:"text/csv"});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href=url; a.download=data.filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      const s = `date,product_id,product_name,category,quantity_sold,unit_cost\n2024-01-01,AP001,Engine Oil Filter,Engine,80,450\n2024-01-02,AP001,Engine Oil Filter,Engine,85,450`;
      const blob = new Blob([s],{type:"text/csv"});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href=url; a.download="autoparts_sample.csv"; a.click();
    }
  };

  const uploadFile = async (file) => {
    if (!file?.name.endsWith(".csv")) { setError("Please upload a CSV file."); return; }
    setUploading(true); setError(null); setProgress(0);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await axios.post(`${apiBase}/api/upload`, form, {
        headers: {"Content-Type":"multipart/form-data"},
        onUploadProgress: e => setProgress(Math.round((e.loaded/e.total)*100)),
      });
      onDataLoaded(data);
    } catch(e) {
      setError(e.response?.data?.detail||"Upload failed. Check CSV format.");
    } finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontWeight:700,fontSize:15}}>Upload Your Sales Data</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2,fontFamily:"var(--mono)"}}>
            Required columns: date, product_id, product_name, category, quantity_sold, unit_cost
          </div>
        </div>
        <button className="btn btn-outline" onClick={downloadSample} style={{fontSize:12}}>
          ⬇ Download Sample CSV
        </button>
      </div>
      <div className={`upload-zone${dragging?" drag-over":""}`}
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);uploadFile(e.dataTransfer.files[0])}}
        onClick={()=>inputRef.current.click()}>
        <input ref={inputRef} type="file" accept=".csv" style={{display:"none"}}
          onChange={e=>uploadFile(e.target.files[0])}/>
        {uploading ? (
          <div>
            <div style={{fontSize:24,marginBottom:10}}>⏳</div>
            <div style={{fontSize:14,fontWeight:600,marginBottom:10}}>Analysing... {progress}%</div>
            <div style={{width:200,margin:"0 auto"}}>
              <div className="progress-track">
                <div className="progress-fill" style={{width:`${progress}%`,background:"var(--primary)"}}/>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:32,marginBottom:10}}>📂</div>
            <div style={{fontSize:14,fontWeight:700,color:"var(--text2)",marginBottom:6}}>
              Drop your CSV file here
            </div>
            <div style={{fontSize:12,color:"var(--text3)"}}>or click to browse · CSV files only</div>
          </div>
        )}
      </div>
      {error && (
        <div style={{marginTop:10,padding:"10px 14px",background:"var(--red-lt)",
          border:"1px solid var(--red-md)",borderRadius:8,fontSize:13,color:"var(--red)"}}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}