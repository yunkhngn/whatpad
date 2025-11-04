import UserImage from "../../components/UserImage";
import avatarPlaceholder from '../../assests/images/avatar-placeholder.jpg'

export default function UserProfilePage() {
    return <div>
        <UserImage size={'lg'} imgUrl={avatarPlaceholder} />
    </div>
}