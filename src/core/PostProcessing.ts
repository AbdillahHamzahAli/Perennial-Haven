import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export interface PostProcessingOptions {
  bloom?: { strength: number; radius: number; threshold: number }
  /** warna pengali untuk menggeser nuansa (mis. tosca); putih = netral */
  tint?: THREE.ColorRepresentation
  /** 0..1, seberapa kuat tint diterapkan */
  tintAmount?: number
  saturation?: number
  contrast?: number
  /** 0..1, gelapnya tepi layar */
  vignette?: number
}

/**
 * Rantai post-processing: scene → bloom lembut → tone mapping/sRGB → grading + vignette.
 * Render target memakai MSAA supaya helai tipis tidak bergerigi.
 */
export class PostProcessing {
  readonly composer: EffectComposer
  readonly bloom: UnrealBloomPass
  readonly grade: ShaderPass

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options: PostProcessingOptions = {},
  ) {
    const size = renderer.getSize(new THREE.Vector2())
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: 4,
    })
    this.composer = new EffectComposer(renderer, target)
    this.composer.setPixelRatio(renderer.getPixelRatio())
    this.composer.setSize(size.x, size.y)

    const b = options.bloom ?? { strength: 0.15, radius: 0.7, threshold: 1 }
    this.bloom = new UnrealBloomPass(size.clone().multiplyScalar(0.5), b.strength, b.radius, b.threshold)

    this.grade = new ShaderPass(GradeShader)
    const u = this.grade.uniforms
    u.uTint.value = new THREE.Color(options.tint ?? 0xffffff)
    u.uTintAmount.value = options.tintAmount ?? 0
    u.uSaturation.value = options.saturation ?? 1
    u.uContrast.value = options.contrast ?? 1
    u.uVignette.value = options.vignette ?? 0

    this.composer.addPass(new RenderPass(scene, camera))
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass()) // tone mapping + konversi sRGB
    this.composer.addPass(this.grade) // bekerja di warna layar
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height)
  }

  render() {
    this.composer.render()
  }
}

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: new THREE.Color(0xffffff) },
    uTintAmount: { value: 0 },
    uSaturation: { value: 1 },
    uContrast: { value: 1 },
    uVignette: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;
    uniform float uTintAmount;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D( tDiffuse, vUv );
      vec3 c = tex.rgb;
      float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
      c = mix( vec3( l ), c, uSaturation );
      c = ( c - 0.5 ) * uContrast + 0.5;
      c = mix( c, c * uTint, uTintAmount );
      float d = distance( vUv, vec2( 0.5 ) );
      c *= 1.0 - uVignette * smoothstep( 0.35, 0.8, d );
      gl_FragColor = vec4( clamp( c, 0.0, 1.0 ), tex.a );
    }
  `,
}
