import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  BookOpen, 
  Code, 
  ArrowRight,
  Zap,
  Target,
  CheckCircle
} from "lucide-react";
import type { PersonalizedRecommendation, DashboardPersonalization } from "@/lib/personalization";

interface PersonalizedRecommendationsProps {
  personalization: DashboardPersonalization;
  onActionClick?: (actionId: string) => void;
}

const PersonalizedRecommendations = ({ 
  personalization, 
  onActionClick 
}: PersonalizedRecommendationsProps) => {
  const { primaryMessage, recommendations, nextSteps, highlightedSection } = personalization;

  const getMessageIcon = () => {
    switch (primaryMessage.type) {
      case 'coaching': return <Target className="w-6 h-6 text-purple-600" />;
      case 'progress': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'achievement': return <Zap className="w-6 h-6 text-yellow-600" />;
      default: return <Lightbulb className="w-6 h-6 text-blue-600" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'project': return Code;
      case 'action': return ArrowRight;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-blue-500 to-purple-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Message */}
      <Card className={`shadow-lg border-0 ${
        highlightedSection === 'learning' ? 'ring-2 ring-purple-200' :
        highlightedSection === 'building' ? 'ring-2 ring-blue-200' : ''
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getMessageIcon()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {primaryMessage.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {primaryMessage.subtitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Recommended for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const IconComponent = getRecommendationIcon(rec.type);
                return (
                  <div 
                    key={rec.id} 
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      rec.priority === 'high' ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' :
                      rec.priority === 'medium' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getPriorityColor(rec.priority)} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                          {rec.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-700 text-xs">High Priority</Badge>
                          )}
                          {rec.urgency && (
                            <Badge variant="outline" className="text-xs">{rec.urgency}</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                        {rec.action && (
                          <div>
                            {rec.action.link ? (
                              <Link to={rec.action.link}>
                                <Button size="sm" className="text-xs">
                                  {rec.action.label}
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            ) : (
                              <Button 
                                size="sm" 
                                className="text-xs"
                                onClick={() => onActionClick?.(rec.action?.onClick || rec.id)}
                              >
                                {rec.action.label}
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Your Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalizedRecommendations; 