import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Investor } from "../../types";
import { Card, CardBody, CardFooter } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface InvestorCardProps {
  investor: Investor;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true,
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/profile/investor/${investor.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${investor.id}`);
  };

  // Helper to safely filter empty arrays
  const safeArray = (arr: any[] | undefined) => {
    return Array.isArray(arr)
      ? arr.filter((item) => item && String(item).trim() !== "")
      : [];
  };

  const validStages = safeArray(investor.investmentStage);
  const validInterests = safeArray(investor.investmentInterests);

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
              investor.avatarUrl ||
              `https://ui-avatars.com/api/?name=${investor.name || "User"}`
            }
            alt={investor.name || "Investor"}
            size="lg"
            status={investor.isOnline ? "online" : "offline"}
            className="mr-4"
          />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {investor.name || "Unknown Investor"}
            </h3>
            <p className="text-sm text-gray-500 mb-2 min-h-[20px]">
              Investor • {investor.totalInvestments || 0} investments
            </p>

            <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
              {validStages.length > 0 ? (
                validStages.map((stage, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {stage}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-400">
                  Stages not specified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Investment Interests
          </h4>
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {validInterests.length > 0 ? (
              validInterests.map((interest, index) => (
                <Badge key={index} variant="primary" size="sm">
                  {interest}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-400">
                Interests not specified
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
            {investor.bio || "No biography provided by this investor."}
          </p>
        </div>

        <div className="mt-auto pt-4 flex justify-between items-end">
          <div>
            <span className="text-xs text-gray-500 block">
              Investment Range
            </span>
            <p className="text-sm font-medium text-gray-900">
              {investor.minimumInvestment || "Not Disclosed"} -{" "}
              {investor.maximumInvestment || "Not Disclosed"}
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
