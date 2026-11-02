// Geometry follows the actual socket anchors. Dimensions here are illustrative,
// never used as the measured cable length in the project.
export function rackCableRoute(start,end,{lane=0,side=1,exit=false}={}){
 const a=start.point,b=end.point,da=start.direction,db=end.direction;
 const step=(p,d,n)=>p.map((v,i)=>v+d[i]*n);
 const lead=.11,clearance=.24+(lane%4)*.025,front=Math.sign(da[2]||side),back=Math.sign(db[2]||side);
 const va=step(a,da,lead),vb=step(b,db,lead);
 const za=a[2]+front*clearance,zb=b[2]+back*clearance;
 // Side routing keeps long leads away from the equipment faces. Different faces
 // travel around the outer rail instead of cutting through the chassis.
 const rail=.82+(lane%4)*.025;
 const points=[va,step(va,da,.08),[rail,a[1]-.04,za]];
 if(front===back)points.push([rail,b[1]-.06,zb]);
 else points.push([rail,a[1]-.08,0],[rail,b[1]-.08,0],[rail,b[1]-.06,zb]);
 points.push(step(vb,db,.08),vb);
 return {points,start:va,end:vb,exit};
}
