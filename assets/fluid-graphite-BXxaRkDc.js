const _e=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main(){
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Le=`#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
void main(){ fragColor = texture(uTexture, vUv); }`,Pe=`#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float value;
void main(){ fragColor = value * texture(uTexture, vUv); }`,Ce=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec2 texelSize;
uniform bool shading;
uniform float inkOpacity;
uniform float inkDensityGain;
void main(){
  vec3 c = texture(uTexture, vUv).rgb;
  float density = max(c.r, max(c.g, c.b));
  float contour = 1.0;
  if (shading) {
    vec3 lc = texture(uTexture, vL).rgb;
    vec3 rc = texture(uTexture, vR).rgb;
    vec3 tc = texture(uTexture, vT).rgb;
    vec3 bc = texture(uTexture, vB).rgb;
    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);
    vec3 n = normalize(vec3(dx, dy, max(length(texelSize), 0.00001)));
    contour = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.76, 0.76, 1.0);
  }
  float a = clamp(density * inkDensityGain * contour, 0.0, inkOpacity);
  vec3 graphite = mix(vec3(0.17), vec3(0.025), clamp(density * 8.0, 0.0, 1.0));
  fragColor = vec4(graphite, a);
}`,Ie=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
uniform vec2 direction;
uniform float stretch;
void main(){
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;

  // Shape each emission along the pointer trajectory instead of as a round
  // stamp. This removes the visible "ball" at the head of the stroke while
  // preserving enough area for the solver to create natural turbulence.
  vec2 d = normalize(direction + vec2(0.000001, 0.0));
  vec2 n = vec2(-d.y, d.x);
  vec2 q = vec2(dot(p, d) / max(stretch, 1.0), dot(p, n));

  vec3 splat = exp(-dot(q,q) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`,we=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main(){
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`,ye=`#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}`,De=`#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`,ge=`#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main(){
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, vec2(-1000.0)), vec2(1000.0));
  fragColor = vec4(velocity, 0.0, 1.0);
}`,Me=`#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`,Ue=`#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main(){
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;function ve(t,c,s){const o=t.createShader(c);if(t.shaderSource(o,s),t.compileShader(o),!t.getShaderParameter(o,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(o)||"Shader compile error");return o}function C(t,c){const s=t.createProgram();if(t.attachShader(s,ve(t,t.VERTEX_SHADER,_e)),t.attachShader(s,ve(t,t.FRAGMENT_SHADER,c)),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))throw new Error(t.getProgramInfoLog(s)||"Program link error");const o={},e=t.getProgramParameter(s,t.ACTIVE_UNIFORMS);for(let p=0;p<e;p++){const m=t.getActiveUniform(s,p);o[m.name]=t.getUniformLocation(s,m.name)}return{p:s,uniforms:o}}function W(t,c,s,o,e,p,m){t.activeTexture(t.TEXTURE0);const f=t.createTexture();t.bindTexture(t.TEXTURE_2D,f),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,m),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,m),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,o,c,s,0,e,p,null);const l=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,l),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,f,0),t.viewport(0,0,c,s),t.clear(t.COLOR_BUFFER_BIT),{texture:f,fbo:l,width:c,height:s,texelSizeX:1/c,texelSizeY:1/s,attach(a){return t.activeTexture(t.TEXTURE0+a),t.bindTexture(t.TEXTURE_2D,f),a}}}function j(t,c,s,o,e,p,m){let f=W(t,c,s,o,e,p,m),l=W(t,c,s,o,e,p,m);return{width:c,height:s,texelSizeX:f.texelSizeX,texelSizeY:f.texelSizeY,get read(){return f},set read(a){f=a},get write(){return l},set write(a){l=a},swap(){const a=f;f=l,l=a}}}function me(t,c){let s=t.drawingBufferWidth/t.drawingBufferHeight;s<1&&(s=1/s);const o=Math.round(c),e=Math.round(c*s);return t.drawingBufferWidth>t.drawingBufferHeight?{width:e,height:o}:{width:o,height:e}}function k(t={}){const c=t.COLOR_PALETTE||[[118,18,28],[139,24,34],[158,32,42],[176,42,50],[116,116,116],[196,196,196]],s=t.COLOR_INTENSITY??.105,[o,e,p]=c[Math.floor(Math.random()*c.length)];return{r:o/255*s,g:e/255*s,b:p/255*s}}function Ne(t,c,s={}){const o=t.getContext("2d");if(!o)return{destroy(){}};const e=s.INPUT_DEADZONE_PX??4.5,p=s.TRAIL_SPACING_PX??7,m=[];let f=0,l=!1,a=0,I=0;function g(){const d=Math.min(window.devicePixelRatio||1,s.DPR_CAP??2);t.width=Math.floor(t.clientWidth*d),t.height=Math.floor(t.clientHeight*d),o.setTransform(d,0,0,d,0,0)}function x(){l=!1}function w(d){const v=c.getBoundingClientRect(),E=d.clientX-v.left,n=d.clientY-v.top;if(E<0||E>v.width||n<0||n>v.height)return x();if(!l){l=!0,a=E,I=n;return}const T=E-a,R=n-I,V=Math.hypot(T,R);if(V<e)return;const X=Math.min(18,Math.max(1,Math.ceil(V/p))),z=k(s);for(let F=1;F<=X;F++){const G=F/X;m.push({x:a+T*G,y:I+R*G,r:8,life:1,c:z})}m.length>120&&m.splice(0,m.length-120),a=E,I=n}function U(){o.clearRect(0,0,t.clientWidth,t.clientHeight),o.globalCompositeOperation="source-over";for(let d=m.length-1;d>=0;d--){const v=m[d];if(v.r+=.75,v.life-=.028,v.life<=0){m.splice(d,1);continue}const E=o.createRadialGradient(v.x,v.y,0,v.x,v.y,v.r);E.addColorStop(0,`rgba(22,22,22,${.12*v.life})`),E.addColorStop(1,"rgba(22,22,22,0)"),o.fillStyle=E,o.beginPath(),o.arc(v.x,v.y,v.r,0,Math.PI*2),o.fill()}o.globalCompositeOperation="source-over",f=requestAnimationFrame(U)}return c.addEventListener("pointermove",w,{passive:!0}),c.addEventListener("pointerleave",x,{passive:!0}),addEventListener("resize",g,{passive:!0}),g(),U(),{setActive(d){active!==d&&(active=d,active?(last=performance.now(),f=requestAnimationFrame(frame)):(cancelAnimationFrame(f),resetPointer()))},destroy(){cancelAnimationFrame(f),c.removeEventListener("pointermove",w),c.removeEventListener("pointerleave",x),removeEventListener("resize",g)}}}function Oe(t,c,s={}){if(!t||!c||matchMedia("(prefers-reduced-motion: reduce)").matches)return null;const o={SIM_RESOLUTION:192,DYE_RESOLUTION:1024,DENSITY_DISSIPATION:3.35,VELOCITY_DISSIPATION:1.9,PRESSURE:.1,PRESSURE_ITERATIONS:24,CURL:3,SPLAT_RADIUS:.105,DYE_RADIUS_SCALE:.66,VELOCITY_RADIUS_SCALE:1,SPLAT_STRETCH:2.15,SPLAT_FORCE:6e3,SHADING:!0,COLOR_UPDATE_SPEED:10,INPUT_DEADZONE_PX:4.5,TRAIL_SPACING_PX:7,MAX_SEGMENT_SPLATS:16,MAX_SPLATS_PER_FRAME:12,VELOCITY_SMOOTHING:.5,PREDICTION_MS:4,MAX_PREDICTION_PX:7,DPR_CAP:2,CLICK_SPLAT:!1,COLOR_PALETTE:[[118,18,28],[139,24,34],[158,32,42],[176,42,50],[124,124,124],[205,205,205]],COLOR_INTENSITY:.105,INK_OPACITY:.72,INK_DENSITY_GAIN:5.6,...s},e=t.getContext("webgl2",{alpha:!0,depth:!1,stencil:!1,antialias:!1,preserveDrawingBuffer:!1,powerPreference:"high-performance"});if(!e||!e.getExtension("EXT_color_buffer_float"))return Ne(t,c,o);const p=!!e.getExtension("OES_texture_float_linear"),m=p?e.LINEAR:e.NEAREST;e.clearColor(0,0,0,0);const f={copy:C(e,Le),clear:C(e,Pe),display:C(e,Ce),splat:C(e,Ie),advection:C(e,we),divergence:C(e,ye),curl:C(e,De),vorticity:C(e,ge),pressure:C(e,Me),gradient:C(e,Ue)};e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),e.STATIC_DRAW),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.enableVertexAttribArray(0);let l,a,I,g,x,w=0,U=performance.now(),d=0,v=0,E=c.getBoundingClientRect();const n={primed:!1,sampleX:0,sampleY:0,sampleTime:0,emitX:0,emitY:0,smoothVX:0,smoothVY:0,moved:!1,color:k(o)};function T(i){return e.useProgram(i.p),i.uniforms}function R(i){i?(e.viewport(0,0,i.width,i.height),e.bindFramebuffer(e.FRAMEBUFFER,i.fbo)):(e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.bindFramebuffer(e.FRAMEBUFFER,null)),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)}function V(){const i=me(e,o.SIM_RESOLUTION),r=me(e,p?o.DYE_RESOLUTION:256),u=e.HALF_FLOAT;l=j(e,r.width,r.height,e.RGBA16F,e.RGBA,u,m),a=j(e,i.width,i.height,e.RG16F,e.RG,u,m),I=W(e,i.width,i.height,e.R16F,e.RED,u,e.NEAREST),g=W(e,i.width,i.height,e.R16F,e.RED,u,e.NEAREST),x=j(e,i.width,i.height,e.R16F,e.RED,u,e.NEAREST)}function X(){const i=Math.min(window.devicePixelRatio||1,o.DPR_CAP),r=Math.max(1,Math.floor(t.clientWidth*i)),u=Math.max(1,Math.floor(t.clientHeight*i));return t.width!==r||t.height!==u?(t.width=r,t.height=u,V(),y(),!0):!1}function z(i){const r=t.width/t.height;return r>1?i*r:i}function F(i){const r=t.width/t.height;return r<1?i*r:i}function G(i){const r=t.width/t.height;return r>1?i/r:i}function $(i,r,u,S,A){const P=t.width/t.height,_=u/o.SPLAT_FORCE,L=S/o.SPLAT_FORCE,D=Math.hypot(_,L),Y=D>1e-6?_/D:1,O=D>1e-6?L/D:0,b=Math.min(1,D*260),B=1+(o.SPLAT_STRETCH-1)*b;let h=T(f.splat);e.disable(e.BLEND),e.uniform1i(h.uTarget,a.read.attach(0)),e.uniform1f(h.aspectRatio,P),e.uniform2f(h.point,i,r),e.uniform2f(h.direction,Y,O),e.uniform1f(h.stretch,B),e.uniform3f(h.color,u,S,0),e.uniform1f(h.radius,z(o.SPLAT_RADIUS*o.VELOCITY_RADIUS_SCALE/100)),R(a.write),a.swap(),h=T(f.splat),e.uniform1i(h.uTarget,l.read.attach(0)),e.uniform1f(h.aspectRatio,P),e.uniform2f(h.point,i,r),e.uniform2f(h.direction,Y,O),e.uniform1f(h.stretch,B),e.uniform3f(h.color,A.r,A.g,A.b),e.uniform1f(h.radius,z(o.SPLAT_RADIUS*o.DYE_RADIUS_SCALE/100)),R(l.write),l.swap()}function de(i){e.disable(e.BLEND);let r=T(f.curl);e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uVelocity,a.read.attach(0)),R(g),r=T(f.vorticity),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uVelocity,a.read.attach(0)),e.uniform1i(r.uCurl,g.attach(1)),e.uniform1f(r.curl,o.CURL),e.uniform1f(r.dt,i),R(a.write),a.swap(),r=T(f.divergence),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uVelocity,a.read.attach(0)),R(I),r=T(f.clear),e.uniform1i(r.uTexture,x.read.attach(0)),e.uniform1f(r.value,o.PRESSURE),R(x.write),x.swap(),r=T(f.pressure),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uDivergence,I.attach(0));for(let S=0;S<o.PRESSURE_ITERATIONS;S++)e.uniform1i(r.uPressure,x.read.attach(1)),R(x.write),x.swap();r=T(f.gradient),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uPressure,x.read.attach(0)),e.uniform1i(r.uVelocity,a.read.attach(1)),R(a.write),a.swap(),r=T(f.advection),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY);const u=a.read.attach(0);e.uniform1i(r.uVelocity,u),e.uniform1i(r.uSource,u),e.uniform1f(r.dt,i),e.uniform1f(r.dissipation,o.VELOCITY_DISSIPATION),R(a.write),a.swap(),r=T(f.advection),e.uniform2f(r.texelSize,a.texelSizeX,a.texelSizeY),e.uniform1i(r.uVelocity,a.read.attach(0)),e.uniform1i(r.uSource,l.read.attach(1)),e.uniform1f(r.dt,i),e.uniform1f(r.dissipation,o.DENSITY_DISSIPATION),R(l.write),l.swap()}function he(){e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.enable(e.BLEND);const i=T(f.display);e.uniform2f(i.texelSize,1/e.drawingBufferWidth,1/e.drawingBufferHeight),e.uniform1i(i.uTexture,l.read.attach(0)),e.uniform1i(i.shading,o.SHADING?1:0),e.uniform1f(i.inkOpacity,o.INK_OPACITY),e.uniform1f(i.inkDensityGain,o.INK_DENSITY_GAIN),R(null)}function q(i){let r=i instanceof Element?i:null;for(;r;){if(r.hasAttribute("data-skip-splash-cursor"))return!0;r=r.parentElement}return!1}function N(){E=c.getBoundingClientRect()}function J(i,r){const u=E;return{x:i-u.left,y:r-u.top,width:u.width,height:u.height}}function y(){n.primed=!1,n.smoothVX=0,n.smoothVY=0,n.moved=!1}function K(i,r,u){n.primed=!0,n.sampleX=i,n.sampleY=r,n.emitX=i,n.emitY=r,n.sampleTime=u||performance.now(),n.smoothVX=0,n.smoothVY=0,n.moved=!1}function pe(i,r,u){if(!n.primed){K(i,r,u);return}const S=u||performance.now(),A=Math.max(1,S-n.sampleTime),P=(i-n.sampleX)/A,_=(r-n.sampleY)/A,L=o.VELOCITY_SMOOTHING;n.smoothVX+=(P-n.smoothVX)*L,n.smoothVY+=(_-n.smoothVY)*L,n.sampleX=i,n.sampleY=r,n.sampleTime=S,n.moved=Math.hypot(i-n.emitX,r-n.emitY)>=o.INPUT_DEADZONE_PX}function Ee(){if(!n.primed||!n.moved||!l||!a)return;const i=E,r=n.emitX,u=n.emitY,S=Math.hypot(n.smoothVX,n.smoothVY),A=Math.min(1,S/.55);let P=n.smoothVX*o.PREDICTION_MS*A,_=n.smoothVY*o.PREDICTION_MS*A;const L=Math.hypot(P,_);if(L>o.MAX_PREDICTION_PX){const M=o.MAX_PREDICTION_PX/L;P*=M,_*=M}const D=Math.min(i.width,Math.max(0,n.sampleX+P)),Y=Math.min(i.height,Math.max(0,n.sampleY+_)),O=D-r,b=Y-u,B=Math.hypot(O,b);if(B<o.INPUT_DEADZONE_PX){n.moved=!1;return}const h=Math.min(o.MAX_SPLATS_PER_FRAME,o.MAX_SEGMENT_SPLATS,Math.max(1,Math.ceil(B/o.TRAIL_SPACING_PX))),ce=1+Math.min(.48,S*.18);for(let M=1;M<=h;M++){const se=M/h,ue=(M-1)/h,fe=r+O*se,le=u+b*se,Re=r+O*ue,xe=u+b*ue,Se=(fe-Re)/Math.max(1,i.width),Ae=-(le-xe)/Math.max(1,i.height);$(fe/Math.max(1,i.width),1-le/Math.max(1,i.height),F(Se*ce)*o.SPLAT_FORCE,G(Ae*ce)*o.SPLAT_FORCE,n.color)}n.emitX=D,n.emitY=Y,n.moved=!1}function Te(i){if(q(i.target)){y();return}const r=E,u=typeof i.getCoalescedEvents=="function"?i.getCoalescedEvents():[],S=u.length?u:[i];for(const A of S){const P=A.timeStamp||i.timeStamp||performance.now(),_=A.clientX-r.left,L=A.clientY-r.top;if(_<0||L<0||_>r.width||L>r.height){y();continue}pe(_,L,P)}}function Q(i){if(q(i.target))return y();const r=J(i.clientX,i.clientY);K(r.x,r.y,i.timeStamp||performance.now())}function ee(i){Te(i)}function te(i){if(q(i.target))return;const r=J(i.clientX,i.clientY);if(K(r.x,r.y,i.timeStamp||performance.now()),!o.CLICK_SPLAT||!l||!a)return;const u=k(o);u.r*=8,u.g*=8,u.b*=8,$(r.x/Math.max(1,r.width),1-r.y/Math.max(1,r.height),8*(Math.random()-.5),18*(Math.random()-.5),u)}function re(){y()}function ie(){y()}function oe(){y()}let H=!0;function Z(i){if(!H)return;let r=Math.min(Math.max((i-U)/1e3,0),.016666);U=i,v+=r,v>.18&&(v=0,X()),d+=r*o.COLOR_UPDATE_SPEED,d>=1&&(d%=1,n.color=k(o)),Ee(),l&&a&&x&&(de(r),he()),w=requestAnimationFrame(Z)}const ne="onpointerrawupdate"in window?"pointerrawupdate":"pointermove",ae=typeof ResizeObserver<"u"?new ResizeObserver(N):null;return ae?.observe(c),c.addEventListener("pointerenter",Q,{passive:!0}),c.addEventListener(ne,ee,{passive:!0}),c.addEventListener("pointerdown",te,{passive:!0}),c.addEventListener("pointerleave",re,{passive:!0}),c.addEventListener("pointercancel",ie,{passive:!0}),window.addEventListener("blur",oe,{passive:!0}),window.addEventListener("resize",N,{passive:!0}),window.addEventListener("scroll",N,{passive:!0}),N(),X(),w=requestAnimationFrame(Z),{setActive(i){H!==i&&(H=i,H?(U=performance.now(),w=requestAnimationFrame(Z)):(cancelAnimationFrame(w),y()))},destroy(){cancelAnimationFrame(w),ae?.disconnect(),c.removeEventListener("pointerenter",Q),c.removeEventListener(ne,ee),c.removeEventListener("pointerdown",te),c.removeEventListener("pointerleave",re),c.removeEventListener("pointercancel",ie),window.removeEventListener("blur",oe),window.removeEventListener("resize",N),window.removeEventListener("scroll",N)}}}export{Oe as createSplashCursor};
