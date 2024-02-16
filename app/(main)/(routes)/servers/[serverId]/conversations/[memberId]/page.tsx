import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";
import { getOrCreateConversation } from "@/lib/conversation";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

interface MemberIdPageProps {
    params: {
        memberId: string;
        serverId: string;   
    },
    searchParams: {
        video?: boolean;
    }
}

const MemberIdPage = async ({
  params,
  searchParams
}: MemberIdPageProps) => {
    const profile = await currentProfile();

    if(!profile){
        return redirectToSignIn();
    }

    const currentMember = await db.member.findFirst({
        where: {
            serverId: params.serverId,
            profileId: profile.id,
        },
        include: {
            profile: true,
        }
    })

    if(!currentMember) {
        return redirect("/");
    }

    const converation = await getOrCreateConversation(currentMember.id,params.memberId);

    if(!converation){
        return redirect(`/servers/${params.serverId}`);
    }

    const {memberOne,memberTwo} = converation;

    const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne;

    return (
        <div className="bg-white dark:bg-[#313338] flex flex-col h-full">
            <ChatHeader
              imageUrl= {otherMember.profile.imageUrl}
              name={otherMember.profile.name}
              serverId={params.serverId}
              type="coversation"
            />
            {searchParams.video && (
                <MediaRoom 
                  chatId={converation.id}
                  video={true}
                  audio={true}
                />
            )}
            {!searchParams.video && (
                <>
                   <ChatMessages 
                member={currentMember}
                name={otherMember.profile.name}
                chatId={converation.id}
                type="coversation"
                apiUrl="/api/direct-messages"
                paramKey="conversationId"
                paramValue={converation.id}
                socketUrl="/api/socket/direct-messages"
                socketQuery={{
                  conversationId: converation.id,
                }}
            />
            <ChatInput 
                name={otherMember.profile.name}
                type="coversation"
                apiUrl="/api/socket/direct-messages"
                query={{
                  conversationId: converation.id,
                }}
            />
                </>
            )}   
        </div>
    )
}

export default MemberIdPage;