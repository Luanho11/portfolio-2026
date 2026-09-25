/*
 * Fluid cursor implementation adapted from Dale Larroder's open-source
 * SplashCursor component (MIT). Full notice: /THIRD_PARTY_LICENSES.md
 * This variant renders the simulated density as graphite ink on a light canvas.
 */

const BASE_VERTEX = `#version 300 es
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
}`;

const COPY_FRAGMENT = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
void main(){ fragColor = texture(uTexture, vUv); }`;

const CLEAR_FRAGMENT = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float value;
void main(){ fragColor = value * texture(uTexture, vUv); }`;

const DISPLAY_FRAGMENT = `#version 300 es
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
}`

const SPLAT_FRAGMENT = `#version 300 es
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
}`;

const ADVECTION_FRAGMENT = `#version 300 es
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
}`;

const DIVERGENCE_FRAGMENT = `#version 300 es
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
}`;

const CURL_FRAGMENT = `#version 300 es
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
}`;

const VORTICITY_FRAGMENT = `#version 300 es
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
}`;

const PRESSURE_FRAGMENT = `#version 300 es
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
}`;

const GRADIENT_FRAGMENT = `#version 300 es
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
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile error');
  }
  return shader;
}

function program(gl, fragmentSource) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, BASE_VERTEX));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || 'Program link error');
  }
  const uniforms = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(p, i);
    uniforms[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, uniforms };
}

function createFBO(gl, w, h, internalFormat, format, type, filter) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture, fbo, width: w, height: h,
    texelSizeX: 1 / w, texelSizeY: 1 / h,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    }
  };
}

function createDoubleFBO(gl, w, h, internalFormat, format, type, filter) {
  let a = createFBO(gl,w,h,internalFormat,format,type,filter);
  let b = createFBO(gl,w,h,internalFormat,format,type,filter);
  return {
    width:w,height:h,texelSizeX:a.texelSizeX,texelSizeY:a.texelSizeY,
    get read(){return a;}, set read(v){a=v;},
    get write(){return b;}, set write(v){b=v;},
    swap(){ const t=a; a=b; b=t; }
  };
}

function getResolution(gl, resolution) {
  let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspect < 1) aspect = 1 / aspect;
  const min = Math.round(resolution);
  const max = Math.round(resolution * aspect);
  return gl.drawingBufferWidth > gl.drawingBufferHeight
    ? { width:max, height:min }
    : { width:min, height:max };
}

function primaryColor(config = {}) {
  const palette = config.COLOR_PALETTE || [
    [118,18,28], [139,24,34], [158,32,42], [176,42,50],
    [116,116,116], [196,196,196]
  ];
  const intensity = config.COLOR_INTENSITY ?? 0.105;
  const [r,g,b] = palette[Math.floor(Math.random() * palette.length)];
  return { r:r/255*intensity, g:g/255*intensity, b:b/255*intensity };
}

function fallback(canvas, container, config = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy(){} };

  const deadzone = config.INPUT_DEADZONE_PX ?? 4.5;
  const spacing = config.TRAIL_SPACING_PX ?? 7;
  const particles = [];
  let raf = 0;
  let active = true;
  let primed = false;
  let lastX = 0;
  let lastY = 0;

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, config.DPR_CAP ?? 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function reset(){ primed = false; }

  function move(e){
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return reset();

    if (!primed) {
      primed = true;
      lastX = x;
      lastY = y;
      return;
    }

    const dx = x - lastX;
    const dy = y - lastY;
    const dist = Math.hypot(dx,dy);
    if (dist < deadzone) return;

    const steps = Math.min(18, Math.max(1, Math.ceil(dist / spacing)));
    const c = primaryColor(config);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      particles.push({
        x: lastX + dx * t,
        y: lastY + dy * t,
        r: 8,
        life: 1,
        c
      });
    }
    if (particles.length > 120) particles.splice(0, particles.length - 120);
    lastX = x;
    lastY = y;
  }

  function draw(){
    if (!active) return;
    ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
    ctx.globalCompositeOperation='source-over';
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.r += 0.75;
      p.life -= .028;
      if(p.life<=0){ particles.splice(i,1); continue; }
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      g.addColorStop(0,`rgba(22,22,22,${0.12*p.life})`);
      g.addColorStop(1,`rgba(22,22,22,0)`);
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    raf=requestAnimationFrame(draw);
  }

  container.addEventListener('pointermove',move,{passive:true});
  container.addEventListener('pointerleave',reset,{passive:true});
  addEventListener('resize',resize,{passive:true});
  resize();
  draw();

  return {
    setActive(value){
      if (active === value) return;
      active = value;
      if (active) raf = requestAnimationFrame(draw);
      else { cancelAnimationFrame(raf); reset(); }
    },
    destroy(){
      active = false;
      cancelAnimationFrame(raf);
      container.removeEventListener('pointermove',move);
      container.removeEventListener('pointerleave',reset);
      removeEventListener('resize',resize);
    }
  };
}

export function createSplashCursor(canvas, container, overrides={}) {
  if (!canvas || !container || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const config = {
    SIM_RESOLUTION:192,
    DYE_RESOLUTION:1024,
    DENSITY_DISSIPATION:3.35,
    VELOCITY_DISSIPATION:1.9,
    PRESSURE:0.1,
    PRESSURE_ITERATIONS:24,
    CURL:3,
    SPLAT_RADIUS:0.105,
    DYE_RADIUS_SCALE:0.66,
    VELOCITY_RADIUS_SCALE:1.0,
    SPLAT_STRETCH:2.15,
    SPLAT_FORCE:6000,
    SHADING:true,
    COLOR_UPDATE_SPEED:10,
    usePrimaryColors:true,

    // Input polish. These do not change the fluid solver; they make the
    // cursor feel intentional rather than emitting a blob for every jitter.
    INPUT_DEADZONE_PX:4.5,
    TRAIL_SPACING_PX:7,
    MAX_SEGMENT_SPLATS:16,
    MAX_SPLATS_PER_FRAME:12,
    VELOCITY_SMOOTHING:0.5,
    PREDICTION_MS:4,
    MAX_PREDICTION_PX:7,
    DPR_CAP:2,
    CLICK_SPLAT:false,
    COLOR_PALETTE:[[118,18,28],[139,24,34],[158,32,42],[176,42,50],[124,124,124],[205,205,205]],
    COLOR_INTENSITY:0.105,
    INK_OPACITY:0.72,
    INK_DENSITY_GAIN:5.6,
    ...overrides
  };

  const gl = canvas.getContext('webgl2', {
    alpha:true, depth:false, stencil:false, antialias:false, preserveDrawingBuffer:false,
    powerPreference:'high-performance'
  });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return fallback(canvas, container, config);

  const supportLinear = !!gl.getExtension('OES_texture_float_linear');
  const filtering = supportLinear ? gl.LINEAR : gl.NEAREST;
  gl.clearColor(0,0,0,0);

  const P = {
    copy:program(gl,COPY_FRAGMENT), clear:program(gl,CLEAR_FRAGMENT), display:program(gl,DISPLAY_FRAGMENT),
    splat:program(gl,SPLAT_FRAGMENT), advection:program(gl,ADVECTION_FRAGMENT), divergence:program(gl,DIVERGENCE_FRAGMENT),
    curl:program(gl,CURL_FRAGMENT), vorticity:program(gl,VORTICITY_FRAGMENT), pressure:program(gl,PRESSURE_FRAGMENT), gradient:program(gl,GRADIENT_FRAGMENT)
  };

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),gl.STATIC_DRAW);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.enableVertexAttribArray(0);

  let dye,velocity,divergence,curl,pressure;
  let raf=0,last=performance.now(),colorTimer=0;
  let resizeTimer=0;
  let inputRect=container.getBoundingClientRect();

  const pointer = {
    primed:false,
    sampleX:0,
    sampleY:0,
    sampleTime:0,
    emitX:0,
    emitY:0,
    smoothVX:0,
    smoothVY:0,
    moved:false,
    color:primaryColor(config)
  };

  function use(pi){ gl.useProgram(pi.p); return pi.uniforms; }

  function blit(target){
    if(target){
      gl.viewport(0,0,target.width,target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
    } else {
      gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
  }

  function initFBOs(){
    const sim=getResolution(gl,config.SIM_RESOLUTION);
    const dyeRes=getResolution(gl,supportLinear?config.DYE_RESOLUTION:256);
    const half=gl.HALF_FLOAT;
    dye=createDoubleFBO(gl,dyeRes.width,dyeRes.height,gl.RGBA16F,gl.RGBA,half,filtering);
    velocity=createDoubleFBO(gl,sim.width,sim.height,gl.RG16F,gl.RG,half,filtering);
    divergence=createFBO(gl,sim.width,sim.height,gl.R16F,gl.RED,half,gl.NEAREST);
    curl=createFBO(gl,sim.width,sim.height,gl.R16F,gl.RED,half,gl.NEAREST);
    pressure=createDoubleFBO(gl,sim.width,sim.height,gl.R16F,gl.RED,half,gl.NEAREST);
  }

  function resizeCanvas(){
    const dpr=Math.min(window.devicePixelRatio||1,config.DPR_CAP);
    const w=Math.max(1,Math.floor(canvas.clientWidth*dpr));
    const h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w;
      canvas.height=h;
      initFBOs();
      resetPointer();
      return true;
    }
    return false;
  }

  function correctRadius(radius){ const a=canvas.width/canvas.height; return a>1?radius*a:radius; }
  function correctDX(d){ const a=canvas.width/canvas.height; return a<1?d*a:d; }
  function correctDY(d){ const a=canvas.width/canvas.height; return a>1?d/a:d; }

  function splat(x,y,dx,dy,color){
    const aspect=canvas.width/canvas.height;
    const motionX=dx/config.SPLAT_FORCE;
    const motionY=dy/config.SPLAT_FORCE;
    const motionLen=Math.hypot(motionX,motionY);
    const dirX=motionLen>0.000001 ? motionX/motionLen : 1;
    const dirY=motionLen>0.000001 ? motionY/motionLen : 0;
    const speedShape=Math.min(1, motionLen*260);
    const stretch=1+(config.SPLAT_STRETCH-1)*speedShape;

    let u=use(P.splat);
    gl.disable(gl.BLEND);
    gl.uniform1i(u.uTarget,velocity.read.attach(0));
    gl.uniform1f(u.aspectRatio,aspect);
    gl.uniform2f(u.point,x,y);
    gl.uniform2f(u.direction,dirX,dirY);
    gl.uniform1f(u.stretch,stretch);
    gl.uniform3f(u.color,dx,dy,0);
    gl.uniform1f(u.radius,correctRadius(config.SPLAT_RADIUS*config.VELOCITY_RADIUS_SCALE/100));
    blit(velocity.write);
    velocity.swap();

    u=use(P.splat);
    gl.uniform1i(u.uTarget,dye.read.attach(0));
    gl.uniform1f(u.aspectRatio,aspect);
    gl.uniform2f(u.point,x,y);
    gl.uniform2f(u.direction,dirX,dirY);
    gl.uniform1f(u.stretch,stretch);
    gl.uniform3f(u.color,color.r,color.g,color.b);
    gl.uniform1f(u.radius,correctRadius(config.SPLAT_RADIUS*config.DYE_RADIUS_SCALE/100));
    blit(dye.write);
    dye.swap();
  }

  function step(dt){
    gl.disable(gl.BLEND);
    let u=use(P.curl);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uVelocity,velocity.read.attach(0));
    blit(curl);

    u=use(P.vorticity);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uVelocity,velocity.read.attach(0));
    gl.uniform1i(u.uCurl,curl.attach(1));
    gl.uniform1f(u.curl,config.CURL);
    gl.uniform1f(u.dt,dt);
    blit(velocity.write);
    velocity.swap();

    u=use(P.divergence);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uVelocity,velocity.read.attach(0));
    blit(divergence);

    u=use(P.clear);
    gl.uniform1i(u.uTexture,pressure.read.attach(0));
    gl.uniform1f(u.value,config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    u=use(P.pressure);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uDivergence,divergence.attach(0));
    for(let i=0;i<config.PRESSURE_ITERATIONS;i++){
      gl.uniform1i(u.uPressure,pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    u=use(P.gradient);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uPressure,pressure.read.attach(0));
    gl.uniform1i(u.uVelocity,velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    u=use(P.advection);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    const vid=velocity.read.attach(0);
    gl.uniform1i(u.uVelocity,vid);
    gl.uniform1i(u.uSource,vid);
    gl.uniform1f(u.dt,dt);
    gl.uniform1f(u.dissipation,config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    u=use(P.advection);
    gl.uniform2f(u.texelSize,velocity.texelSizeX,velocity.texelSizeY);
    gl.uniform1i(u.uVelocity,velocity.read.attach(0));
    gl.uniform1i(u.uSource,dye.read.attach(1));
    gl.uniform1f(u.dt,dt);
    gl.uniform1f(u.dissipation,config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  function render(){
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    const u=use(P.display);
    gl.uniform2f(u.texelSize,1/gl.drawingBufferWidth,1/gl.drawingBufferHeight);
    gl.uniform1i(u.uTexture,dye.read.attach(0));
    gl.uniform1i(u.shading,config.SHADING?1:0);
    gl.uniform1f(u.inkOpacity,config.INK_OPACITY);
    gl.uniform1f(u.inkDensityGain,config.INK_DENSITY_GAIN);
    blit(null);
  }

  function skip(target){
    let el=target instanceof Element?target:null;
    while(el){
      if(el.hasAttribute('data-skip-splash-cursor')) return true;
      el=el.parentElement;
    }
    return false;
  }

  function refreshInputRect(){
    inputRect=container.getBoundingClientRect();
  }

  function rel(clientX,clientY){
    const r=inputRect;
    return { x:clientX-r.left, y:clientY-r.top, width:r.width, height:r.height };
  }

  function resetPointer(){
    pointer.primed=false;
    pointer.smoothVX=0;
    pointer.smoothVY=0;
    pointer.moved=false;
  }

  function prime(x,y,time){
    pointer.primed=true;
    pointer.sampleX=x;
    pointer.sampleY=y;
    pointer.emitX=x;
    pointer.emitY=y;
    pointer.sampleTime=time || performance.now();
    pointer.smoothVX=0;
    pointer.smoothVY=0;
    pointer.moved=false;
  }

  function sampleMotion(x,y,time){
    if (!pointer.primed) {
      prime(x,y,time);
      return;
    }

    const now=time || performance.now();
    const elapsed=Math.max(1,now-pointer.sampleTime);
    const rawVX=(x-pointer.sampleX)/elapsed;
    const rawVY=(y-pointer.sampleY)/elapsed;
    const k=config.VELOCITY_SMOOTHING;
    pointer.smoothVX += (rawVX-pointer.smoothVX)*k;
    pointer.smoothVY += (rawVY-pointer.smoothVY)*k;

    pointer.sampleX=x;
    pointer.sampleY=y;
    pointer.sampleTime=now;

    // No FIFO backlog: only the newest pointer position matters. This is the
    // main difference from the previous version and keeps the fluid visually
    // attached to the real cursor even during fast strokes.
    pointer.moved = Math.hypot(x-pointer.emitX,y-pointer.emitY) >= config.INPUT_DEADZONE_PX;
  }

  function emitLatestMotion(){
    if(!pointer.primed || !pointer.moved || !dye || !velocity) return;

    const rect=inputRect;
    const fromX=pointer.emitX;
    const fromY=pointer.emitY;

    // A very small capped prediction offsets display latency on 60/120 Hz
    // panels without creating the rubber-band feel of a smoothed cursor.
    const speed=Math.hypot(pointer.smoothVX,pointer.smoothVY);
    const predictionScale=Math.min(1, speed/.55);
    let predictX=pointer.smoothVX*config.PREDICTION_MS*predictionScale;
    let predictY=pointer.smoothVY*config.PREDICTION_MS*predictionScale;
    const predictLen=Math.hypot(predictX,predictY);
    if(predictLen>config.MAX_PREDICTION_PX){
      const f=config.MAX_PREDICTION_PX/predictLen;
      predictX*=f; predictY*=f;
    }

    const toX=Math.min(rect.width,Math.max(0,pointer.sampleX+predictX));
    const toY=Math.min(rect.height,Math.max(0,pointer.sampleY+predictY));
    const dx=toX-fromX;
    const dy=toY-fromY;
    const dist=Math.hypot(dx,dy);

    if(dist < config.INPUT_DEADZONE_PX){
      pointer.moved=false;
      return;
    }

    const steps=Math.min(
      config.MAX_SPLATS_PER_FRAME,
      config.MAX_SEGMENT_SPLATS,
      Math.max(1,Math.ceil(dist/config.TRAIL_SPACING_PX))
    );
    const speedBoost=1+Math.min(.48,speed*.18);

    for(let i=1;i<=steps;i++){
      const t=i/steps;
      const prev=(i-1)/steps;
      const sx=fromX+dx*t;
      const sy=fromY+dy*t;
      const px=fromX+dx*prev;
      const py=fromY+dy*prev;
      const segDX=(sx-px)/Math.max(1,rect.width);
      const segDY=-(sy-py)/Math.max(1,rect.height);
      splat(
        sx/Math.max(1,rect.width),
        1-sy/Math.max(1,rect.height),
        correctDX(segDX*speedBoost)*config.SPLAT_FORCE,
        correctDY(segDY*speedBoost)*config.SPLAT_FORCE,
        pointer.color
      );
    }

    pointer.emitX=toX;
    pointer.emitY=toY;
    pointer.moved=false;
  }

  function processPointerEvent(e){
    if(skip(e.target)){
      resetPointer();
      return;
    }

    const rect=inputRect;
    const events=typeof e.getCoalescedEvents==='function' ? e.getCoalescedEvents() : [];
    const samples=events.length ? events : [e];
    for(const sample of samples){
      const stamp=sample.timeStamp || e.timeStamp || performance.now();
      const x=sample.clientX-rect.left;
      const y=sample.clientY-rect.top;
      if(x<0||y<0||x>rect.width||y>rect.height){
        resetPointer();
        continue;
      }
      sampleMotion(x,y,stamp);
    }
  }

  function onPointerEnter(e){
    if(skip(e.target)) return resetPointer();
    const p=rel(e.clientX,e.clientY);
    prime(p.x,p.y,e.timeStamp || performance.now());
  }

  function onPointerMove(e){ processPointerEvent(e); }

  function onPointerDown(e){
    if(skip(e.target)) return;
    const p=rel(e.clientX,e.clientY);
    prime(p.x,p.y,e.timeStamp || performance.now());
    if(!config.CLICK_SPLAT || !dye || !velocity) return;
    const c=primaryColor(config);
    c.r*=8;
    c.g*=8;
    c.b*=8;
    splat(
      p.x/Math.max(1,p.width),
      1-p.y/Math.max(1,p.height),
      8*(Math.random()-.5),
      18*(Math.random()-.5),
      c
    );
  }

  function onPointerLeave(){ resetPointer(); }
  function onPointerCancel(){ resetPointer(); }
  function onWindowBlur(){ resetPointer(); }

  let active = true;

  function frame(now){
    if (!active) return;
    let dt=Math.min(Math.max((now-last)/1000,0),.016666);
    last=now;

    // Resize checks are throttled. Querying layout every animation frame can
    // subtly hurt pointer responsiveness on lower-end machines.
    resizeTimer+=dt;
    if(resizeTimer>.18){
      resizeTimer=0;
      resizeCanvas();
    }

    colorTimer+=dt*config.COLOR_UPDATE_SPEED;
    if(colorTimer>=1){
      colorTimer%=1;
      pointer.color=primaryColor(config);
    }

    emitLatestMotion();
    if(dye&&velocity&&pressure){
      step(dt);
      render();
    }
    raf=requestAnimationFrame(frame);
  }

  const inputMoveEvent=('onpointerrawupdate' in window) ? 'pointerrawupdate' : 'pointermove';
  const rectObserver=typeof ResizeObserver!=='undefined' ? new ResizeObserver(refreshInputRect) : null;
  rectObserver?.observe(container);

  container.addEventListener('pointerenter',onPointerEnter,{passive:true});
  container.addEventListener(inputMoveEvent,onPointerMove,{passive:true});
  container.addEventListener('pointerdown',onPointerDown,{passive:true});
  container.addEventListener('pointerleave',onPointerLeave,{passive:true});
  container.addEventListener('pointercancel',onPointerCancel,{passive:true});
  window.addEventListener('blur',onWindowBlur,{passive:true});
  window.addEventListener('resize',refreshInputRect,{passive:true});
  window.addEventListener('scroll',refreshInputRect,{passive:true});

  refreshInputRect();
  resizeCanvas();
  raf=requestAnimationFrame(frame);

  return {
    setActive(value){
      if (active === value) return;
      active = value;
      if (active) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
        resetPointer();
      }
    },
    destroy(){
      cancelAnimationFrame(raf);
      rectObserver?.disconnect();
      container.removeEventListener('pointerenter',onPointerEnter);
      container.removeEventListener(inputMoveEvent,onPointerMove);
      container.removeEventListener('pointerdown',onPointerDown);
      container.removeEventListener('pointerleave',onPointerLeave);
      container.removeEventListener('pointercancel',onPointerCancel);
      window.removeEventListener('blur',onWindowBlur);
      window.removeEventListener('resize',refreshInputRect);
      window.removeEventListener('scroll',refreshInputRect);
    }
  };
}
