if [ ! -e ncfetch.cgi ] ; then  cp redirect.cgi ncfetch.cgi; fi 
if [ ! -e objinfo.cgi ] ; then  cp redirect.cgi  objinfo.cgi ; fi
if [ ! -e seqfeat.cgi ] ; then  cp redirect.cgi  seqfeat.cgi ; fi
if [ ! -e seqinfo.cgi ] ; then  cp redirect.cgi  seqinfo.cgi ; fi
if [ ! -e sv_data.cgi ] ; then  cp redirect.cgi  sv_data.cgi ; fi
if [ ! -e sv_seqsearch.cgi ] ; then  cp redirect.cgi  sv_seqsearch.cgi ; fi
if [ ! -e link.cgi ] ; then  cp redirect.cgi  link.cgi ; fi
if [ ! -e objcoords.cgi ] ; then  cp redirect.cgi  objcoords.cgi ; fi
if [ ! -e seqconfig.cgi ] ; then  cp redirect.cgi  seqconfig.cgi ; fi
if [ ! -e seqgraphic.cgi ] ; then  cp redirect.cgi  seqgraphic.cgi ; fi
if [ ! -e sequence.cgi ] ; then  cp redirect.cgi  sequence.cgi ; fi
if [ ! -e tinyURL.cgi ] ; then  cp redirect.cgi  tinyURL.cgi ; fi
if [ ! -e featsearch.cgi ] ; then  cp redirect.cgi  featsearch.cgi ; fi
if [ ! -e feedback.cgi ] ; then  cp redirect.cgi  feedback.cgi ; fi
if [ ! -e alnmulti.cgi ] ; then  cp redirect.cgi  alnmulti.cgi ; fi

#
#        this.m_CGIs = {
#            prefix:     prefix,
#            html_prefix: html_prefix,
#            SeqSearch:  prefix + 'sv_seqsearch.cgi',
#            FeatSearch: prefix + 'featsearch.cgi',
#            ObjInfo:    prefix + 'objinfo.cgi',
#            SvData:     prefix + 'sv_data.cgi',
#            Feedback:   prefix + 'feedback.cgi',
#            TinyURL:    prefix + 'tinyURL.cgi',
#            Config:     prefix + 'seqconfig.cgi',
#            Panorama:   prefix + 'seqgraphic.cgi',
#            Graphic:    prefix + 'seqgraphic.cgi',
#            Alignment:  prefix + 'alnmulti.cgi',
#            ObjCoords:  prefix + 'objcoords.cgi',
#            Sequenc:    prefix + 'seqfeat.cgi',
#            Link:       prefix + 'link.cgi',
#            SequenceSave: prefix + 'sequence.cgi'
#        };
#    },
#
#
