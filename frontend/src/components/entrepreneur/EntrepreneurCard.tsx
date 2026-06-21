import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Entrepreneur } from "../../types";
import { Card, CardBody, CardFooter } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true,
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneur.id}`);
  };

  return (
    <Card
      hoverable
      className="transition-all duration-300 h-full flex flex-col"
      onClick={handleViewProfile}
    >
      <CardBody className="flex flex-col flex-grow">
        <div className="flex items-start">
          <Avatar
            src={
              entrepreneur.avatarUrl ||
              `https://ui-avatars.com/api/?name=${entrepreneur.name || "User"}`
            }
            alt={entrepreneur.name || "Entrepreneur"}
            size="lg"
            status={entrepreneur.isOnline ? "online" : "offline"}
            className="mr-4"
          />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {entrepreneur.name || "Unknown Entrepreneur"}
            </h3>
            {/* Fallback & Min-height added to prevent layout shift */}
            <p className="text-sm text-gray-500 mb-2 min-h-[20px]">
              {entrepreneur.startupName || "Startup details pending"}
            </p>

            {/* Conditional Rendering for Badges to avoid empty colored boxes */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
              {entrepreneur.industry && entrepreneur.industry.trim() !== "" && (
                <Badge variant="primary" size="sm">
                  {entrepreneur.industry}
                </Badge>
              )}
              {entrepreneur.location && entrepreneur.location.trim() !== "" && (
                <Badge variant="gray" size="sm">
                  {entrepreneur.location}
                </Badge>
              )}
              {entrepreneur.foundedYear &&
                String(entrepreneur.foundedYear).trim() !== "" && (
                  <Badge variant="accent" size="sm">
                    Founded {entrepreneur.foundedYear}
                  </Badge>
                )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Pitch Summary
          </h4>
          {/* Fallback text and line clamping preserved */}
          <p className="text-sm text-gray-600 line-clamp-3 min-h-[60px]">
            {entrepreneur.pitchSummary ||
              "No pitch summary provided. Reach out directly to learn more about this startup's vision."}
          </p>
        </div>

        <div className="mt-auto pt-4 flex justify-between items-end">
          <div>
            <span className="text-xs text-gray-500 block">Funding Need</span>
            <p className="text-sm font-medium text-gray-900">
              {entrepreneur.fundingNeeded || "Not Disclosed"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-500 block">Team Size</span>
            {/* Prevent hanging "people" text if size is null */}
            <p className="text-sm font-medium text-gray-900">
              {entrepreneur.teamSize
                ? `${entrepreneur.teamSize} people`
                : "Not Specified"}
            </p>
          </div>
        </div>
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between mt-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>

          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
