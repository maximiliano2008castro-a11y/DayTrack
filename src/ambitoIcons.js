// Phosphor icon map for each ámbito — monochrome, no emoji
import {
  BookOpen, Briefcase, Barbell, ForkKnife,
  Heart, Wallet, Brain, Users, PaintBrush, Star,
} from '@phosphor-icons/react'

export const AMBITO_ICONS = {
  escolar:      BookOpen,
  trabajo:      Briefcase,
  gym:          Barbell,
  alimentacion: ForkKnife,
  salud:        Heart,
  finanzas:     Wallet,
  mente:        Brain,
  social:       Users,
  hobbies:      PaintBrush,
  personal:     Star,
}

// Returns the Phosphor icon component for an ámbito id
export function getAmbitoIcon(id) {
  return AMBITO_ICONS[id] || Star
}
