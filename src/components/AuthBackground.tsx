import { Wind } from 'lucide-react';

export default function AuthBackground() {
  return (
    <div className="auth-background" aria-hidden="true">
      {/* Sky glow */}
      <div className="auth-sky-glow" />

      {/* Moving clouds */}
      <div className="auth-cloud auth-cloud-1">
        <span />
        <span />
        <span />
      </div>

      <div className="auth-cloud auth-cloud-2">
        <span />
        <span />
        <span />
      </div>

      <div className="auth-cloud auth-cloud-3">
        <span />
        <span />
        <span />
      </div>

      {/* Atmospheric particles */}
      <div className="auth-particles">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      {/* Wind lines */}
      <div className="auth-wind auth-wind-1">
        <Wind size={28} />
      </div>

      <div className="auth-wind auth-wind-2">
        <Wind size={20} />
      </div>

      <div className="auth-wind auth-wind-3">
        <Wind size={24} />
      </div>

      {/* Masked boy */}
      <div className="masked-boy">
        <div className="boy-hair">
          <span />
          <span />
          <span />
        </div>

        <div className="boy-head">
          <div className="boy-ear left" />
          <div className="boy-ear right" />

          <div className="boy-face">
            <div className="boy-eye left-eye" />
            <div className="boy-eye right-eye" />

            <div className="boy-mask">
              <div className="mask-line line-1" />
              <div className="mask-line line-2" />
              <div className="mask-line line-3" />
            </div>
          </div>
        </div>

        <div className="boy-neck" />

        <div className="boy-body">
          <div className="boy-jacket">
            <div className="jacket-line" />
          </div>
        </div>
      </div>

      {/* Foreground haze */}
      <div className="auth-haze" />
    </div>
  );
}