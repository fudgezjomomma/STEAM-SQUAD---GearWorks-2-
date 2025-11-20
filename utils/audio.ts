/**
 * Simple Audio Synthesizer for UI feedback using Web Audio API.
 * Generates procedural sounds for mechanical interactions to avoid external assets.
 */
class AudioManager {
    ctx: AudioContext | null = null;
    motorOsc: OscillatorNode | null = null;
    motorGain: GainNode | null = null;
    isMuted: boolean = false;

    private init() {
        if (!this.ctx) {
            // Cross-browser support
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        // Resume context if suspended (browser autoplay policy)
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(err => console.warn("AudioContext resume failed", err));
        }
    }

    toggleMute(mute: boolean) {
        this.isMuted = mute;
        if (mute) {
            this.stopMotor();
        }
    }

    /**
     * Play a short, high-pitch "Click/Snap" sound
     * Used when gears attach to the grid or each other.
     */
    playSnap() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        // Fast pitch drop for a percussive "click" effect
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

        // Fast volume decay
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.start(t);
        osc.stop(t + 0.05);
    }

    /**
     * Play a success chime (C Major Arpeggio)
     * Used when a challenge is completed.
     */
    playSuccess() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        
        const t = this.ctx.currentTime;
        
        // Chord: C (523.25) - E (659.25) - G (783.99)
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            const startTime = t + (i * 0.1);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
            
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    /**
     * Manage continuous motor hum
     * Pitch scales with RPM. Volume scales slightly with speed.
     */
    updateMotor(rpm: number, active: boolean) {
        if (this.isMuted || !active || rpm === 0) {
            this.stopMotor();
            return;
        }
        this.init();
        if (!this.ctx) return;

        if (!this.motorOsc) {
            this.motorOsc = this.ctx.createOscillator();
            this.motorGain = this.ctx.createGain();
            
            // Sawtooth wave filtered sounds mechanical/buzzy
            this.motorOsc.type = 'sawtooth';
            
            // Create a LowPass filter to muffle the harshness
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400; 

            this.motorOsc.connect(filter);
            filter.connect(this.motorGain);
            this.motorGain.connect(this.ctx.destination);
            
            this.motorOsc.start();
        }

        // Map RPM (1-300) to Frequency (e.g. 40Hz - 100Hz)
        const baseFreq = 30 + (rpm / 4);
        
        const t = this.ctx.currentTime;
        // Smooth transition to new frequency
        this.motorOsc.frequency.setTargetAtTime(baseFreq, t, 0.1);
        
        // Volume based on speed (faster = louder)
        const volume = 0.02 + (rpm / 300) * 0.05;
        this.motorGain!.gain.setTargetAtTime(volume, t, 0.1);
    }

    private stopMotor() {
        if (this.motorGain && this.ctx) {
            this.motorGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
        // We don't stop() the oscillator node because they are one-use only.
        // We just mute the gain to "stop" the sound, ready to ramp up again.
    }
}

export const audioManager = new AudioManager();
