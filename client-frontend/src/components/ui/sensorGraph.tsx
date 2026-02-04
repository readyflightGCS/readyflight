
function HSVtoRGB(h: number, s: number, v: number) {
    let r: number, g: number, b: number;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            (r = v), (g = t), (b = p);
            break;
        case 1:
            (r = q), (g = v), (b = p);
            break;
        case 2:
            (r = p), (g = v), (b = t);
            break;
        case 3:
            (r = p), (g = q), (b = v);
            break;
        case 4:
            (r = t), (g = p), (b = v);
            break;
        case 5:
            (r = v), (g = p), (b = q);
            break;
        default:
            r = 0;
            g = 0;
            b = 0;
    }
    const pad = (x: string) => "0".repeat(2 - x.length) + x;
    return (
        "#" +
        pad(Math.round(r * 255).toString(16)) +
        pad(Math.round(g * 255).toString(16)) +
        pad(Math.round(b * 255).toString(16))
    );
}

interface Sensor {
    colour: string;
    measurements: number[];
    name: string;
}

export function draw_graph(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, sensor: Sensor) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const n_points = 50;
    const point_spacing = canvas.width / (n_points - 2);
    let x = point_spacing;
    const begin_idx = Math.max(0, sensor.measurements.length - n_points);
    let min = Math.min(...sensor.measurements.slice(begin_idx));
    let max = Math.max(...sensor.measurements.slice(begin_idx));
    let scl = (max - min) / canvas.height;
    ctx.lineWidth = 2;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.strokeStyle = sensor.colour;
    ctx.fillStyle = sensor.colour;
    for (let j = begin_idx; j < sensor.measurements.length - 2; j++) {
        ctx.beginPath();
        ctx.moveTo(x - point_spacing, canvas.height - (sensor.measurements[j] - min) / scl);
        ctx.lineTo(x, canvas.height - (sensor.measurements[j + 1] - min) / scl);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, canvas.height - (sensor.measurements[j + 1] - min) / scl, 2, 0, Math.PI * 2);
        ctx.fill();
        x += point_spacing;
    }
    ctx.lineWidth = 1;
}

import { useRef, useEffect } from 'react';

export default function Telemetry(sensor: Sensor) {
  console.log(sensor);
  const canvasRef = useRef(null)
  
  useEffect(() => {
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let animationFrameId: number = 0;
    
    const render = () => {
      draw_graph(canvas, context, sensor);
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw_graph])
  
  return (
    <>
    <div style={{padding: "0px 6px", display: "flex", flexDirection: "column"}}>
      <p style={{textAlign: "center", fontSize: "12px"}}>{sensor.name}</p>
      <canvas ref={canvasRef} style={{width: "100px", height: "50px", "borderRadius": "0px", backgroundColor: "#333333"}} />
    </div>
    <style>{`
    `}</style>
    </>
  );
}
