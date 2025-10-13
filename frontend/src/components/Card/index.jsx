import './Card.css'

const Card = ({ children, className = "", onClick }) => {
    return (
        <div className={`custom-card ${className}`} onClick={onClick}>
            {children}
        </div>
    )
}
export default Card