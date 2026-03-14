export default function Spinner({ size = '', style = {} }) {
  return <div className={`spinner${size ? ' spinner-' + size : ''}`} style={style} />;
}
