import './Button.css'

function Button({ children, variant = "primary", onClick, className = "" }) {
    return (
        <button className={`custom-button ${variant} ${className}`} onClick={onClick}>
            {children}
        </button>
    )
}

export default Button